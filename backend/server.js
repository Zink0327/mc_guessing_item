const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from frontend dist directory (if built)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Load data files
const consolidatedItems = JSON.parse(fs.readFileSync(path.join(__dirname, 'consolidated_items.json'), 'utf8'));
const craftingRecipes = JSON.parse(fs.readFileSync(path.join(__dirname, 'crafting_grid.json'), 'utf8'));

function getConsolidatedCategory(itemId) { 
    for (const [category, items] of Object.entries(consolidatedItems)) {
        if (items.includes(itemId)) {
            return category;
        }
    }

    return null;
}

function recursiveConsolidateItems(itemId) {
    let tmp = getConsolidatedCategory(itemId), res = null;
    while (tmp !== null) {
        res = tmp;
        tmp = getConsolidatedCategory(tmp);
        console.log(res, tmp);
        if (res === tmp) {
            break;
        }
    }

    return res;
}

// Helper function to calculate crafting steps (limited to 2 steps)
function calculateCraftingSteps(startItem, targetItem) {
    if (startItem === targetItem) return 0;
    if (consolidatedItems[targetItem] && consolidatedItems[targetItem].includes(startItem)) return 0;
    
    // Get actual item IDs, handling consolidated items
    function checkOneStep(src, target) {
        const targetRecipe = craftingRecipes[target];
    
        if (targetRecipe) {
            // Check direct ingredients
            for (const ingredient of targetRecipe) {
                console.log(`Checking ingredient: ${ingredient} and ${src}`);
                if (!ingredient || ingredient === 'air') continue;
                
                // Check if ingredient matches startItem directly
                if (ingredient === src) {
                    return true;
                }
                
                // Check if ingredient is a category that contains startItem
                if (consolidatedItems[ingredient] && consolidatedItems[ingredient].includes(src)) {
                    return true;
                }
            }
        }
        return false;
    }

    function checkTwoSteps(src, target) { 
        const targetRecipe = craftingRecipes[target];
        if (targetRecipe) {
            // Check if src can make any of the ingredients needed for target
            for (const ingredient of targetRecipe) {
                if (!ingredient || ingredient === 'air') continue;
                
                // Check if src can directly make this ingredient
                if (checkOneStep(src, ingredient)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // we assure that the startItem is an actual item
    
    // Step 1: Check if startItem can directly craft targetItem
    if(checkOneStep(startItem, targetItem)) {
        return 1;
    }

    if(checkTwoSteps(startItem, targetItem)) {
        return 2;
    }
    
    return null; // No path found within 2 steps
}

// Test the crafting steps calculation
console.log('Testing crafting steps calculation (2-step limit):');
console.log('Acacia planks -> Stick:', calculateCraftingSteps('acacia_planks', 'stick'));
console.log('Acacia log -> Acacia planks:', calculateCraftingSteps('acacia_log', 'acacia_planks'));
console.log('Diamond -> Diamond sword:', calculateCraftingSteps('diamond', 'diamond_sword'));
console.log('Same item test:', calculateCraftingSteps('diamond', 'diamond'));
console.log('Two-step test:', calculateCraftingSteps('acacia_log', 'stick'));
console.log('Unreachable test:', calculateCraftingSteps('acacia_log', 'diamond'));

// API Routes

// Get main crafting grid (random crafting recipe)
app.get('/api/crafting/main-grid', (req, res) => {
    try {
        // 获取所有物品ID
        const itemIds = Object.keys(craftingRecipes);
        
        // 如果没有可用的物品ID，返回空网格
        if (itemIds.length === 0) {
            console.warn('No items available in crafting recipes, returning empty grid');
            return res.json({ 
                grid: Array(9).fill(null),
                itemId: 'empty'
            });
        }
        
        let randomRecipe, randomItemId;
        let attempts = 0;
        const maxAttempts = 100; // 防止无限循环
        
        // 循环直到找到非空配方或达到最大尝试次数
        do {
            const randomIndex = Math.floor(Math.random() * itemIds.length);
            randomItemId = itemIds[randomIndex];
            randomRecipe = craftingRecipes[randomItemId];
            attempts++;
            
            // 安全检查：确保配方存在且不是空数组
            if (!randomRecipe) continue;
            
            // 检查配方是否全部为null（或无效值）
            const isAllNull = randomRecipe.every(item => item === null || item === '');
            
            if (!isAllNull || attempts >= maxAttempts) {
                break;
            }
            
        } while (true);
        
        if (attempts >= maxAttempts) {
            console.warn('Warning: Could not find non-empty recipe after maximum attempts, returning empty grid');
            randomRecipe = Array(9).fill(null);
            randomItemId = 'empty';
        } else {
            console.log(`>>> Returning random crafting grid for item: ${randomItemId} <<<`);
        }
        
        res.json({ 
            grid: randomRecipe,
            itemId: randomItemId
        });
    } catch (error) {
        console.error('Error getting main crafting grid:', error);
        res.status(500).json({ error: 'Failed to get main crafting grid' });
    }
});

// Get crafting grid for specific item
app.get('/api/crafting/grid/:itemId', (req, res) => {
    try {
        const itemId = decodeURIComponent(req.params.itemId);
        let recipe = craftingRecipes[itemId];
        
        // If item not found in crafting recipes, search in consolidated_items
        if (!recipe) {
            console.log(`Item ${itemId} not found in crafting recipes, searching in consolidated items...`);
            
            // Search for the item in consolidated_items.json
            let foundItem = null;
            
            for (const [category, items] of Object.entries(consolidatedItems)) {
                if (itemId === category) {
                    foundItem = items[0];
                    console.log(`Found item ${itemId} in category: ${category}`);
                    break;
                }
            }
            
            // If found in consolidated items, use the first item from that category as fallback
            if (foundItem) {
                const fallbackRecipe = craftingRecipes[foundItem];
                if (fallbackRecipe) {
                    recipe = fallbackRecipe;
                    console.log(`Using recipe for ${foundItem} as fallback for ${itemId}`);
                } else {
                    // If even the found item has no recipe, return empty grid
                    recipe = Array(9).fill(null);
                    console.log(`No recipe found for ${foundItem}, returning empty grid`);
                }
            } else {
                // Item not found anywhere, return empty grid
                recipe = Array(9).fill(null);
                console.log(`Item ${itemId} not found in consolidated items, returning empty grid`);
            }
        }
        
        res.json({ grid: recipe });
    } catch (error) {
        console.error('Error getting crafting grid:', error);
        res.status(500).json({ error: 'Failed to get crafting grid' });
    }
});

// Get crafting steps between two items
app.get('/api/crafting/steps', (req, res) => {
    try {
        const { item, dist } = req.query;
        
        if (!item || !dist) {
            return res.status(400).json({ error: 'Both item and dist parameters are required' });
        }
        
        const startItem = decodeURIComponent(item);
        const targetItem = decodeURIComponent(dist);
        
        const steps = calculateCraftingSteps(startItem, targetItem);
        
        res.json({ steps });
    } catch (error) {
        console.error('Error calculating crafting steps:', error);
        res.status(500).json({ error: 'Failed to calculate crafting steps' });
    }
});

// Get item icon (placeholder implementation)
app.get('/api/item/icon/:itemId', (req, res) => {
    try {
        const itemId = decodeURIComponent(req.params.itemId);
        
        // In a real implementation, this would return actual icon data
        // For now, we'll return a placeholder
        const iconData = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiBmaWxsPSIjRkZGRkZGIi8+Cjx0ZXh0IHg9IjgiIHk9IjgiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzMzMyIgZGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkklPC90ZXh0Pgo8L3N2Zz4K`;
        
        res.json({ icon: iconData });
    } catch (error) {
        console.error('Error getting item icon:', error);
        res.status(500).json({ error: 'Failed to get item icon' });
    }
});

app.get('/api/item/is-consolidated/:itemId', (req, res) => { 
    try {
        let foundItem = null;
        const itemId = decodeURIComponent(req.params.itemId);

        // Search for the item in consolidated_items.json categories
        for (const [category, items] of Object.entries(consolidatedItems)) {
            if (itemId === category && items.length > 0) {
                foundItem = items[0]; // Return the first item in the category
                console.log(`Found consolidated item ${itemId} -> ${foundItem} in category: ${category}`);
                break;
            }
        }

        // Return consistent JSON response
        res.json({ 
            isConsolidated: foundItem,
            requestedItem: itemId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in /api/item/is-consolidated:', error);
        res.status(500).json({ 
            error: 'Failed to check consolidated item status',
            isConsolidated: null 
        });
    }
});

app.get('/api/item/get-category/:itemId', (req, res) => { 
    try {
        const category = recursiveConsolidateItems(decodeURIComponent(req.params.itemId));
        res.json({ category });
    } catch (error) {
        res.status(500).json({ error: `Failed to get item category: ${error}` });
    }
})

// Fallback route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});