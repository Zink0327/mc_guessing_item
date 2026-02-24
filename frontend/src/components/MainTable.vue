<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import CraftingTable from './crafting_table/CraftingTable.vue';
import mcGuessServerCommunication from '../components/serverCommunication.ts';
import type { CraftingGrid, CraftItem, RevealGrid } from './common/commonType.ts';
import { itemNameMatch } from '../components/itemNameMatch.ts';
import { log } from './common/debug.ts';

type selectedType = {
  id: string;
  name: string;
  steps: number;
};
 
// Define emits for parent communication
const emit = defineEmits<{
  (e: 'main-grid-loaded', data: { itemId: string; grid: CraftingGrid }): void;
  (e: 'main-grid-result-changed', result: string): void;
  (e: 'revealed-items-updated', items: string[]): void;
}>();

// State to track which box was clicked
const clickedBoxIndex = ref<number | null>(null);
const isPopupVisible = ref(false);
const openedPopupIndex = ref<number | null>(null);

const mcsc = new mcGuessServerCommunication();
const craftingGria_1 = ref<CraftingGrid>([null,null,null,null,null,null,null,null,null]);
const craftingGria_2 = ref<CraftingGrid>([null,null,null,null,null,null,null,null,null]);
const revealGrid_1 = ref<RevealGrid>([false,false,false,false,false,false,false,false,false,false]);
const revealGrid_2 = ref<RevealGrid>([false,false,false,false,false,false,false,false,false,false]);
const mainResult = ref<string>("");
const innerResult = ref<string>("");

let revealedItems: Array<selectedType> = [];

// Props for receiving selected item from parent
interface Props {
  selectedItem?: selectedType | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedItem: null
});

// Computed keys to force re-render when grids change
const mainTableKey = ref(0);

const popupTableKey = ref(0);

// Handle selected item from SearchBar
const handleSelectedItem = async (selectedItem: selectedType | null) => {
  if (!selectedItem) return;
  
  log('Received selected item in MainTable:', selectedItem);
  // Just print the item and do nothing else
  log(`Item ID: ${selectedItem.id}, Item Name: ${selectedItem.name}`);

  // check the main crafting grid
  revealedItems.push(selectedItem);
  log('Revealed items:', revealedItems);
  
  // Emit event when revealed items change
  let tmp = revealedItems.map(item => item.id);
  emit('revealed-items-updated', tmp);
 
  //update main reveal grid
  await updateRevealGrid(craftingGria_1.value, revealGrid_1.value, mainResult.value);

  if (revealGrid_1.value[9] === true) {
    revealGrid_1.value = Array(10).fill(true);
  }
  mainTableKey.value++;
  
};

// Watch for selectedItem changes from parent
watch(() => props.selectedItem, (newItem) => {
  if (newItem) {
    handleSelectedItem(newItem);
  }
}, { deep: true });

async function updateRevealGrid(craftingGrid: CraftingGrid, revealGrid: RevealGrid, result: string) {
  log('Updating reveal grid for crafting grid:', craftingGrid);
  for (let i = 0; i < craftingGrid.length; i++) {
    let item = craftingGrid[i];
    if (item instanceof Array) {
      item = item[0];
    }
    if (item !== null && item !== undefined) {
      for (let j = 0; j < revealedItems.length; j++) {
        const revealedItem = revealedItems[j];
        if (revealedItem !== undefined && await itemNameMatch(item, revealedItem.id)) {
          revealGrid[i] = true;
          break;
        }
      }
    }
  }

  for (let j = 0; j < revealedItems.length; j++) {
    const revealedItem = revealedItems[j];
    if (revealedItem !== undefined && await itemNameMatch(result, revealedItem.id)) {
      revealGrid[9] = true;
    }
  }

  log('Updating reveal grid:', revealGrid);
}

// Handle grid cell click event
async function handleGridClick(index: number) {
  clickedBoxIndex.value = index;
  log(`Box ${index} was clicked`);
  openedPopupIndex.value = index + 1;
  
  // 添加类型检查，确保只在项目是字符串时调用API
  const item = craftingGria_1.value[index];
  if (typeof item === 'string' && item !== null) {
    innerResult.value = item;
    mcsc.getCraftingGrid(item).then(async data => {
      craftingGria_2.value = data;
      revealGrid_2.value = [false, false, false, false, false, false, false, false, false, false];
      await updateRevealGrid(data, revealGrid_2.value, item);
      if (revealGrid_1.value[index] === true) {
        revealGrid_2.value = Array(10).fill(true);
      }
      log('Popup grid updated with data:', data);
      popupTableKey.value++;
    }).catch(error => {
      console.error('Failed to load crafting grid:', error);
      craftingGria_2.value = [null, null, null, null, null, null, null, null, null];
    });

  } else if (item instanceof Array && item.length > 0 && item[0] !== undefined) {
    innerResult.value = item[0];
    mcsc.getCraftingGrid(item[0]).then(async data => {
      craftingGria_2.value = data;
      await updateRevealGrid(data, revealGrid_2.value, innerResult.value);
      if (revealGrid_1.value[index] === true) {
        revealGrid_2.value = Array(10).fill(true);
      }
      log('Popup grid updated with array data:', data);
      popupTableKey.value++;
    }).catch(error => {
      console.error('Failed to load crafting grid:', error);
      craftingGria_2.value = [null, null, null, null, null, null, null, null, null];
    });
  } else {
    log('Clicked item is not a valid string:', item);
    craftingGria_2.value = [null, null, null, null, null, null, null, null, null];
  }
}

// Handle popup open event
function handlePopupOpen(index: number) {
  isPopupVisible.value = true;
  log(`Popup opened for box ${index}`);
}

// Handle popup close event
function handlePopupClose() {
  isPopupVisible.value = false;
  log('Popup closed');
}

// Load main crafting grid when component mounts
onMounted(async () => {
  try {
    log('Loading main crafting grid...');
    const data = await mcsc.getMainCraftingGrid();
    mainResult.value = data.itemId;
    craftingGria_1.value = data.grid;
    
    // Emit events to parent component
    emit('main-grid-loaded', { itemId: data.itemId, grid: data.grid });
    emit('main-grid-result-changed', data.itemId);
    
    log('Main crafting grid loaded:', craftingGria_1.value, mainResult.value);
    log('Emitted main-grid-loaded event with itemId:', data.itemId);
  } catch (error) {
    console.error('Failed to load main crafting grid:', error);
    // Set default empty grid on error
    craftingGria_1.value = [null, null, null, null, null, null, null, null, null];
    mainResult.value = "error";
    
    // Emit error event
    emit('main-grid-result-changed', "error");
  }
});
</script>

<template>
  <div class="app-container">
    <!-- Main crafting table -->
    <CraftingTable 
      :deny-click="false"
      @grid-click="handleGridClick"
      @popup-open="handlePopupOpen"
      @popup-close="handlePopupClose"
      :crafting-grid="craftingGria_1"
      :result="mainResult"
      :key="mainTableKey"
      :height="400"
      :reveal-grid="revealGrid_1"
    />
      <!-- Popup Dialog -->
  <dialog ref="modalDialogRef" class="info-panel" id="mydialog123">
    <div class="popup-content">
      <h3>这是主合成区 {{ openedPopupIndex }} 号格子物品的合成配方</h3>
      <h3>如果全为空，那么其不是通过合成系统得到</h3>
      <CraftingTable :deny-click="true" :width="700" :height="400"
        :crafting-grid="craftingGria_2"
        :result="innerResult"
        :key="popupTableKey"
        :reveal-grid="revealGrid_2"
      />
    </div>
  </dialog>
  </div>
</template>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.info-panel {
  border: 1px solid #d0e8ff;
  border-radius: 8px;
  padding: 15px;
}

.info-panel p {
  margin: 5px 0;
}

h3 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
  font-family: Arial, Helvetica, sans-serif;
}
</style>