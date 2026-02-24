<script setup lang="ts">
import { ref } from 'vue';
import MainTable from './components/MainTable.vue';
import SearchBar from './components/SearchBar.vue';
import ResultList from './components/ResultList.vue';
import mcGuessServerCommunication from './components/serverCommunication.ts';
import {itemNameMatch} from './components/itemNameMatch.ts';
import { log } from './components/common/debug.ts';

interface SelectedItem {
    id: string;
    name: string;
    steps: number;
}

const selectedItems = ref<SelectedItem[]>([]);
const currentSelectedItem = ref<SelectedItem | null>(null);
let currentResult: string = "";
let mcsc = new mcGuessServerCommunication();

const success = ref(false);
const sKey = ref(0);
const showHelp = ref(false);

const handleItemSelect = async (item: SelectedItem) => {
    // Check if item is already selected
    const existingIndex = selectedItems.value.findIndex(selected => selected.id === item.id);
    
    try {
        // Get crafting steps and wait for it to complete
        const steps = await mcsc.getCraftingSteps(item.id, currentResult);
        if (steps !== null) {
            item.steps = steps;
        }
        
        // Check if this is the correct answer using itemNameMatch
        const isCorrect = await itemNameMatch(item.id, currentResult);
        
        if (existingIndex === -1) {
            // Add new item to the beginning of the list
            selectedItems.value.unshift(item);
        }
        
        // Pass selected item to MainTable
        currentSelectedItem.value = item;
        log('Forwarding selected item to MainTable:', item);
        log('Is correct answer:', isCorrect);
        log('Steps to target:', item.steps);

        // Show success message if correct
        if (isCorrect) {
            success.value = true;
            sKey.value += 1;
            log('=== SUCCESS! Correct answer detected ===');
            item.steps = 0;
        }
    } catch (error) {
        console.error('Error processing item selection:', error);
        // Still add the item even if there's an error
        if (existingIndex === -1) {
            selectedItems.value.unshift(item);
        }
        currentSelectedItem.value = item;
    }
};

// Handle main grid loaded event
const handleMainGridLoaded = (data: { itemId: string; grid: any[] }) => {
    log('=== MAIN GRID LOADED EVENT RECEIVED ===');
    log('Item ID:', data.itemId);
    log('Grid data:', data.grid);
    log('========================================');
    currentResult = data.itemId;
    // Reset success state when new grid loads
    success.value = false;
};

// Handle main grid result changed event
const handleMainGridResultChanged = (result: string) => {
    log('=== MAIN GRID RESULT CHANGED EVENT RECEIVED ===');
    log('New result:', result);
    log('================================================');
    currentResult = result;
    // Reset success state when result changes
    success.value = false;
};

// Handle revealed items updated event
const handleRevealedItemsUpdated = (items: string[]) => {
    log('=== REVEALED ITEMS UPDATED EVENT RECEIVED ===');
    log('Current revealed items:', items);
    log('Total count:', items.length);
    log('=============================================');
};

// Toggle help modal
const toggleHelp = () => {
  showHelp.value = !showHelp.value;
};

// Close help when clicking outside
const closeHelp = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.classList.contains('help-backdrop')) {
    showHelp.value = false;
  }
};

// Close help on Escape key
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && showHelp.value) {
    showHelp.value = false;
  }
};

// Add event listeners
document.addEventListener('keydown', handleKeydown);
</script>

<template>
  <div class="app-container">
    <div class="header">
      <h1>Minecraft 猜物品</h1>
      <button class="help-button" @click="toggleHelp">?</button>
    </div>
    
    <!-- Help Modal -->
    <div v-if="showHelp" class="help-modal" @click="closeHelp">
      <div class="help-backdrop"></div>
      <div class="help-content" @click.stop>
        <div class="help-header">
          <h2>游戏说明</h2>
          <button class="close-button" @click="toggleHelp">×</button>
        </div>
        <div class="help-body">
          <p><strong>游戏目标：</strong>有一个目标Minecraft物品，猜测区为其合成配方。你需要根据合成配方猜出目标物品。</p>
          
          <h3>玩法说明：</h3>
          <ul>
            <li>选择物品进行猜测，系统会显示从该物品合成目标物品需要多少步骤。</li>
            <li>点击主猜测区域的1-9格以查看该格的合成配方。</li>
            <li>所有物品一开始都是隐藏的，一旦猜中就会显示在对应的位置。</li>
            <li>猜测记录会显示与答案距离小于3的正确物品，帮助你了解合成关系。<br>距离显示：距离表示该物品与答案相差多少合成步骤；“远”表示大于2步。</li>
            <li>正确猜出目标物品即可获胜！</li>
          </ul>
          <h3>模糊匹配</h3>
          <ul>
            <li>系统可能会忽略颜色词（白色、橙色、红色等）、木材类型（橡木、云杉等）和材质词（染色、抛光、切割等）。<br>例如：输入“红羊毛”可能匹配“橙羊毛”，输入“红色玻璃板”可能匹配“紫色染色玻璃板”。</li>
          </ul>
          <h3>其他说明</h3>
          <ul>
            <li>有灰色背景的格子空白格，不能点击。</li>
            <li>物品信息截止到Minecraft JE 1.20.5。</li>
          </ul>
        </div>
      </div>
    </div>
    
    <!-- Success Message -->
    <div v-if="success" class="success-message" :key="sKey">
      <h2>恭喜你猜中答案！</h2>
    </div>
    
    <div class="search-section">
      <SearchBar @item-selected="handleItemSelect" />
    </div>
    <div class="main-table">
      <MainTable 
        :selected-item="currentSelectedItem" 
        @main-grid-loaded="handleMainGridLoaded"
        @main-grid-result-changed="handleMainGridResultChanged"
        @revealed-items-updated="handleRevealedItemsUpdated"
      />
    </div>
    <div class="results-section">
      <ResultList 
        :selected-items="selectedItems"
      />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, Helvetica, sans-serif;
  position: relative;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
}

h1 {
  color: #333;
  margin: 0;
}

.help-button {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #eee;
  color: white;
  border: none;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.help-button:hover {
  background-color: #ccc;
  transform: scale(1.1);
}

.success-message {
  color: #7af97a;
  text-align: center;
  font-size: 0.7rem;
}

.success-message h2 {
  margin: 0 0 10px 0;
  font-size: 2em;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.search-section {
  margin-bottom: 20px;
}

.results-section {
  margin-bottom: 20px;
}

.main-table {
  display: table;
  margin: 0 auto;
}

/* Help Modal Styles */
.help-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
}

.help-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.help-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  border-radius: 10px 10px 0 0;
}

.help-header h2 {
  margin: 0;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #eee;
  color: #333;
}

.help-body {
  padding: 20px;
  color: #333;
  line-height: 1.6;
}

.help-body h3 {
  margin: 15px 0 10px 0;
  color: #007bff;
}

.help-body ul {
  padding-left: 20px;
  margin: 10px 0;
}

.help-body li {
  margin: 8px 0;
}

.color-green {
  color: #28a745;
  font-weight: bold;
}

.color-yellow {
  color: #ffc107;
  font-weight: bold;
}

.color-gray {
  color: #6c757d;
  font-weight: bold;
}

/* Responsive design */
@media (max-width: 600px) {
  .header {
    flex-direction: column;
    gap: 10px;
  }
  
  .help-content {
    width: 95%;
    margin: 10px;
  }
  
  .help-header {
    padding: 15px;
  }
  
  .help-body {
    padding: 15px;
  }
}
</style>