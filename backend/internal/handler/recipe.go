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
	"gorm.io/gorm"
)

type ingredientCost struct {
	model.RecipeIngredient
	UnitCostPerGram *float64 `json:"unit_cost_per_gram"`
	LineCost        float64  `json:"line_cost"`
}

type recipeCost struct {
	model.Recipe
	Ingredients  []ingredientCost `json:"ingredients"`
	CostPerBatch float64          `json:"cost_per_batch"`
	CostPerBag   float64          `json:"cost_per_bag"`
	ProfitPerBag float64          `json:"profit_per_bag"`
}

func toRecipeCost(r model.Recipe) recipeCost {
	out := recipeCost{Recipe: r, Ingredients: make([]ingredientCost, len(r.Ingredients))}
	var costPerBatch float64
	for i, ing := range r.Ingredients {
		var unitCost *float64
		var lineCost float64
		if ing.Item != nil && ing.Item.PackagePrice != nil && ing.Item.PackageSizeG != nil && *ing.Item.PackageSizeG > 0 {
			c := *ing.Item.PackagePrice / *ing.Item.PackageSizeG
			unitCost = &c
			lineCost = c * ing.QuantityG
		}
		costPerBatch += lineCost
		out.Ingredients[i] = ingredientCost{RecipeIngredient: ing, UnitCostPerGram: unitCost, LineCost: lineCost}
	}
	out.CostPerBatch = costPerBatch
	if r.BagsPerBatch > 0 {
		out.CostPerBag = costPerBatch / r.BagsPerBatch
	}
	out.ProfitPerBag = r.SalePricePerBag - out.CostPerBag
	return out
}

// attachIngredientItems fetches the Item for every ingredient across the given recipes
// in a single query and attaches it. (GORM's nested Preload("Ingredients.Item") does not
// reliably resolve this belongs-to hop, so it's done manually here.)
func (h *Handler) attachIngredientItems(recipes []model.Recipe) {
	idSet := map[uint]bool{}
	for _, r := range recipes {
		for _, ing := range r.Ingredients {
			idSet[ing.ItemID] = true
		}
	}
	if len(idSet) == 0 {
		return
	}
	ids := make([]uint, 0, len(idSet))
	for id := range idSet {
		ids = append(ids, id)
	}
	var items []model.Item
	h.db.Where("item_id IN ?", ids).Find(&items)
	itemMap := make(map[uint]*model.Item, len(items))
	for i := range items {
		itemMap[items[i].ItemID] = &items[i]
	}
	for ri := range recipes {
		for ii := range recipes[ri].Ingredients {
			recipes[ri].Ingredients[ii].Item = itemMap[recipes[ri].Ingredients[ii].ItemID]
		}
	}
}

func (h *Handler) ListRecipes(c *gin.Context) {
	var recipes []model.Recipe
	h.db.Preload("Ingredients").Where("deleted_at IS NULL").Order("name ASC").Find(&recipes)
	h.attachIngredientItems(recipes)

	result := make([]recipeCost, len(recipes))
	for i, r := range recipes {
		result[i] = toRecipeCost(r)
	}
	response.Success(c, result)
}

type recipeIngredientRequest struct {
	ItemID    uint    `json:"item_id" binding:"required"`
	QuantityG float64 `json:"quantity_g" binding:"required"`
}

type recipeRequest struct {
	Name            string                    `json:"name" binding:"required"`
	BagsPerBatch    float64                   `json:"bags_per_batch" binding:"required"`
	SalePricePerBag float64                   `json:"sale_price_per_bag"`
	Ingredients     []recipeIngredientRequest `json:"ingredients" binding:"required"`
}

func (req recipeRequest) validate() error {
	if req.BagsPerBatch <= 0 {
		return errBadField{"bags_per_batch must be greater than 0"}
	}
	if req.SalePricePerBag < 0 {
		return errBadField{"sale_price_per_bag cannot be negative"}
	}
	if len(req.Ingredients) == 0 {
		return errBadField{"recipe must have at least one ingredient"}
	}
	for _, ing := range req.Ingredients {
		if ing.QuantityG <= 0 {
			return errBadField{"ingredient quantity_g must be greater than 0"}
		}
	}
	return nil
}

func (h *Handler) CreateRecipe(c *gin.Context) {
	var req recipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if err := req.validate(); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	recipe := model.Recipe{
		Name:            req.Name,
		BagsPerBatch:    req.BagsPerBatch,
		SalePricePerBag: req.SalePricePerBag,
	}
	err := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&recipe).Error; err != nil {
			return err
		}
		for _, ing := range req.Ingredients {
			ri := model.RecipeIngredient{RecipeID: recipe.RecipeID, ItemID: ing.ItemID, QuantityG: ing.QuantityG}
			if err := tx.Create(&ri).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		response.Error(c, http.StatusConflict, "recipe name already exists or invalid ingredient")
		return
	}
	h.db.Preload("Ingredients").First(&recipe, recipe.RecipeID)
	h.attachIngredientItems([]model.Recipe{recipe})

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, nil, model.ActionCreateRecipe, nil, model.JSONMap{
		"recipe_id": recipe.RecipeID,
		"name":      recipe.Name,
	})

	response.Created(c, toRecipeCost(recipe))
}

func (h *Handler) UpdateRecipe(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "invalid id")
		return
	}

	var recipe model.Recipe
	if err := h.db.Where("recipe_id = ? AND deleted_at IS NULL", id).First(&recipe).Error; err != nil {
		response.NotFound(c)
		return
	}

	var req recipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	if err := req.validate(); err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	oldData := model.JSONMap{
		"name":               recipe.Name,
		"bags_per_batch":     recipe.BagsPerBatch,
		"sale_price_per_bag": recipe.SalePricePerBag,
	}

	txErr := h.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&recipe).Updates(map[string]any{
			"name":               req.Name,
			"bags_per_batch":     req.BagsPerBatch,
			"sale_price_per_bag": req.SalePricePerBag,
		}).Error; err != nil {
			return err
		}
		if err := tx.Where("recipe_id = ?", recipe.RecipeID).Delete(&model.RecipeIngredient{}).Error; err != nil {
			return err
		}
		for _, ing := range req.Ingredients {
			ri := model.RecipeIngredient{RecipeID: recipe.RecipeID, ItemID: ing.ItemID, QuantityG: ing.QuantityG}
			if err := tx.Create(&ri).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if txErr != nil {
		response.Error(c, http.StatusConflict, "recipe name already exists or invalid ingredient")
		return
	}
	h.db.Preload("Ingredients").First(&recipe, recipe.RecipeID)
	h.attachIngredientItems([]model.Recipe{recipe})

	claims := c.MustGet("claims").(*auth.Claims)
	h.writeLog(claims.UserID, nil, model.ActionUpdateRecipe, oldData, model.JSONMap{
		"name":               req.Name,
		"bags_per_batch":     req.BagsPerBatch,
		"sale_price_per_bag": req.SalePricePerBag,
	})

	response.Success(c, toRecipeCost(recipe))
}

func (h *Handler) DeleteRecipe(c *gin.Context) {
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

	var recipe model.Recipe
	if err := h.db.Where("recipe_id = ? AND deleted_at IS NULL", id).First(&recipe).Error; err != nil {
		response.NotFound(c)
		return
	}

	h.writeLog(claims.UserID, nil, model.ActionDeleteRecipe, model.JSONMap{
		"recipe_id": recipe.RecipeID,
		"name":      recipe.Name,
	}, nil)

	// ลบ recipe_ingredients ด้วย ไม่ใช่แค่ soft-delete recipe เฉยๆ
	// เพราะ ON DELETE CASCADE ทำงานแค่กับ hard delete — ถ้าทิ้งไว้จะค้าง FK บัง items ที่เคยอ้างไม่ให้ลบ
	h.db.Where("recipe_id = ?", recipe.RecipeID).Delete(&model.RecipeIngredient{})
	h.db.Model(&recipe).Update("deleted_at", time.Now())

	response.Success(c, nil)
}
