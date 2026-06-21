package handler

import (
	"net/http"
	"strconv"
	"time"

	"inventory-dino/internal/model"
	"inventory-dino/pkg/auth"
	"inventory-dino/pkg/response"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type transactionRow struct {
	model.Transaction
	RunningBalance float64 `json:"running_balance" gorm:"column:running_balance"`
}

type transactionSummary struct {
	TotalIncome  float64 `json:"total_income"`
	TotalExpense float64 `json:"total_expense"`
	Net          float64 `json:"net"`
}

type listTransactionsResponse struct {
	Items   []transactionRow   `json:"items"`
	Summary transactionSummary `json:"summary"`
}

func (h *Handler) ListTransactions(c *gin.Context) {
	from := c.DefaultQuery("from", time.Now().Format("2006-01")+"-01")
	to := c.DefaultQuery("to", time.Now().Format("2006-01-02"))

	var rows []transactionRow
	if err := h.db.Raw(`
		SELECT * FROM (
			SELECT t.*,
				SUM(IF(t.type = 'income', t.amount, -t.amount)) OVER (ORDER BY t.txn_date, t.transaction_id) AS running_balance
			FROM transactions t
			WHERE t.deleted_at IS NULL
		) x
		WHERE x.txn_date BETWEEN ? AND ?
		ORDER BY x.txn_date, x.transaction_id
	`, from, to).Scan(&rows).Error; err != nil {
		response.InternalError(c)
		return
	}

	var summary transactionSummary
	h.db.Raw(`
		SELECT
			COALESCE(SUM(IF(type = 'income', amount, 0)), 0) AS total_income,
			COALESCE(SUM(IF(type = 'expense', amount, 0)), 0) AS total_expense
		FROM transactions WHERE deleted_at IS NULL AND txn_date BETWEEN ? AND ?
	`, from, to).Scan(&summary)
	summary.Net = summary.TotalIncome - summary.TotalExpense

	response.Success(c, listTransactionsResponse{Items: rows, Summary: summary})
}

type transactionRequest struct {
	TxnDate       string  `json:"txn_date" binding:"required"`
	Type          string  `json:"type" binding:"required"`
	Amount        float64 `json:"amount" binding:"required"`
	PaymentMethod string  `json:"payment_method" binding:"required"`
	Description   string  `json:"description" binding:"required"`
	HandledBy     string  `json:"handled_by"`
	Note          string  `json:"note"`
}

func (req transactionRequest) validate() (time.Time, error) {
	txnDate, err := time.Parse("2006-01-02", req.TxnDate)
	if err != nil {
		return txnDate, errBadField{"invalid txn_date, expected YYYY-MM-DD"}
	}
	if req.Amount < 0 {
		return txnDate, errBadField{"amount cannot be negative"}
	}
	if req.Type != string(model.TxnIncome) && req.Type != string(model.TxnExpense) {
		return txnDate, errBadField{"type must be income or expense"}
	}
	if req.PaymentMethod != string(model.PaymentCash) && req.PaymentMethod != string(model.PaymentTransfer) {
		return txnDate, errBadField{"payment_method must be cash or transfer"}
	}
	return txnDate, nil
}

type errBadField struct{ msg string }

func (e errBadField) Error() string { return e.msg }

func (h *Handler) CreateTransaction(c *gin.Context) {
	var req transactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	txnDate, err := req.validate()
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	txn := model.Transaction{
		TxnDate:         txnDate,
		Type:            model.TxnType(req.Type),
		Amount:          req.Amount,
		PaymentMethod:   model.PaymentMethod(req.PaymentMethod),
		Description:     req.Description,
		HandledBy:       req.HandledBy,
		Note:            req.Note,
		CreatedByUserID: claims.UserID,
	}
	if err := h.db.Create(&txn).Error; err != nil {
		response.InternalError(c)
		return
	}

	h.writeLog(claims.UserID, nil, model.ActionCreateTransaction, nil, model.JSONMap{
		"transaction_id": txn.TransactionID,
		"type":           req.Type,
		"amount":         req.Amount,
		"description":    req.Description,
	})

	response.Created(c, txn)
}

func (h *Handler) UpdateTransaction(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var txn model.Transaction
	if err := h.db.Where("transaction_id = ? AND deleted_at IS NULL", id).First(&txn).Error; err != nil {
		response.NotFound(c)
		return
	}

	var req transactionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	txnDate, err := req.validate()
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	oldData := model.JSONMap{
		"txn_date":    txn.TxnDate.Format("2006-01-02"),
		"type":        txn.Type,
		"amount":      txn.Amount,
		"description": txn.Description,
	}

	if err := h.db.Model(&txn).Updates(map[string]any{
		"txn_date":       txnDate,
		"type":           req.Type,
		"amount":         req.Amount,
		"payment_method": req.PaymentMethod,
		"description":    req.Description,
		"handled_by":     req.HandledBy,
		"note":           req.Note,
	}).Error; err != nil {
		response.InternalError(c)
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, nil, model.ActionUpdateTransaction, oldData, model.JSONMap{
		"txn_date":    req.TxnDate,
		"type":        req.Type,
		"amount":      req.Amount,
		"description": req.Description,
	})

	response.Success(c, txn)
}

func (h *Handler) DeleteTransaction(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var req struct {
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "password required")
		return
	}

	claims := c.MustGet("claims").(*auth.Claims)
	var admin model.User
	if err := h.db.First(&admin, claims.UserID).Error; err != nil {
		response.InternalError(c)
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(admin.Password), []byte(req.Password)); err != nil {
		response.Error(c, http.StatusUnauthorized, "incorrect password")
		return
	}

	var txn model.Transaction
	if err := h.db.Where("transaction_id = ? AND deleted_at IS NULL", id).First(&txn).Error; err != nil {
		response.NotFound(c)
		return
	}

	h.writeLog(claims.UserID, nil, model.ActionDeleteTransaction, model.JSONMap{
		"transaction_id": txn.TransactionID,
		"description":    txn.Description,
		"amount":         txn.Amount,
	}, nil)

	h.db.Model(&txn).Update("deleted_at", time.Now())

	response.Success(c, nil)
}
