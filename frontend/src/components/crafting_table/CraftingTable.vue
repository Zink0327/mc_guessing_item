<template>
  <v-stage ref="v-stageRef" :width="props.width" :height="props.height" @click="handleSvgClick">
    <!-- 工作台台面 -->
    <v-rect 
      :x="mainTableX" 
      :y="mainTableY" 
      :width="mainTableWidth" 
      :height="mainTableHeight" fill="#E0E0E0" stroke="rgba(0,0,0,0.1)" 
      :stroke-width="4"
      :corner-radius="8" 
    />

    <!-- 3x3合成网格背景 -->
    <v-rect 
      :x="gridStartX - 10" 
      :y="gridStartY - 10" 
      :width="gridAreaWidth + 20" 
      :height="gridAreaHeight + 20"
      fill="#E0E0E0" stroke="rgba(0,0,0,0.1)" 
      :stroke-width="3" 
      :corner-radius="4" 
    />

    <!-- 3x3合成网格 -->
    <template v-for="row in 3" :key="`row-${row}`">
      <template v-for="col in 3" :key="`cell-${row}-${col}`">
        <!-- 网格单元格 -->
        <Block 
          :index="(row - 1) * 3 + (col - 1)"
          :x="gridStartX + (col - 1) * (cellSize + cellSpacing)" 
          :y="gridStartY + (row - 1) * (cellSize + cellSpacing)"
          :width="cellSize" 
          :height="cellSize" 
          hoverable
          :item_id="`grid-${(row - 1) * 3 + (col - 1)}-${Date.now()}`" 
          :item="localCraftingGrid[(row - 1) * 3 + (col - 1)] ?? null"
          @click="handleGridClick((row - 1) * 3 + (col - 1))" 
          class="crafting-cell"
          :revealed="localRevealGrid[(row - 1) * 3 + (col - 1)]"
        >
        </Block>

      </template>
    </template>

    <!-- 合成结果区域与合成网格中心关于箭头的Y坐标对称 -->
    <Block 
      :x="gridStartX + 300 + (cellSize + cellSpacing)" 
      :y="gridStartY + (cellSize + cellSpacing)" 
      :width="cellSize" 
      :height="cellSize" 
      class="result-cell"
      :index="9"
      :item="props.result"
      :item_id="`result`"
      :revealed="localRevealGrid[9]"
    >
    </Block>

    <!-- 箭头图标位于中心 -->
    <path 
      ref="arrowPath" 
      stroke-width="2" 
      stroke="#DAA520" 
      fill="#FFFFFF" 
    />

  </v-stage>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import vStage from './../common/v-stage.vue';
import vRect from './../common/v-rect.vue';
import Block from './Block.vue';
import type { CraftingGrid, RevealGrid } from '../common/commonType';
import { log } from '../common/debug';

interface Props {
  width?: number;
  height?: number;
  craftingGrid: CraftingGrid;
  result: string;
  denyClick?: boolean;
  revealGrid: RevealGrid;
}

// Define emits
const emit = defineEmits<{
  (e: 'gridClick', index: number): void;
  (e: 'popupOpen', index: number): void;
  (e: 'popupClose'): void;
}>()

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 600,
  craftingGrid: () => [null, null, null, null, null, null, null, null, null],
  denyClick: true,
  result: '',
  revealGrid: () => [false, false, false, false, false, false, false, false, false]
});

// Reactive local copy of craftingGrid to handle changes
const localCraftingGrid = ref<CraftingGrid>([...props.craftingGrid]);
const localRevealGrid = ref<RevealGrid>([...props.revealGrid]);

// Watch for changes in the craftingGrid prop
watch(() => props.craftingGrid, (newGrid) => {
  log('Crafting grid updated:', newGrid);
  localCraftingGrid.value = [...newGrid];
}, { deep: true });

watch(() => props.revealGrid, (newGrid) => {
  log('Reveal grid updated:', newGrid);
  localRevealGrid.value = [...newGrid];
})

const cellSize = 60;
const cellSpacing = 8;

const gridAreaWidth = cellSize * 3 + cellSpacing * 2;
const gridAreaHeight = cellSize * 3 + cellSpacing * 2;
const gridStartX = (props.width / 2 - gridAreaWidth / 2) * 0.5;
const gridStartY = props.height / 2 - gridAreaHeight / 2;

const mainTableWidth = 600, 
      mainTableHeight = 300,
      mainTableX = props.width / 2 - mainTableWidth / 2,
      mainTableY = props.height / 2 - mainTableHeight / 2;

log(props.width, props.height, mainTableX, mainTableY, gridStartX, gridStartY, gridAreaWidth, gridAreaHeight);
log(props.craftingGrid);
// Template refs
const arrowPath = ref<SVGPathElement | null>(null);
let modalDialogRef = ref<HTMLDialogElement | null>(null);

// State
const resultSize = 80;
const craftingResult = ref(false);
const isPopupOpen = ref(false);

// 在组件挂载后设置路径数据
onMounted(() => {
  if (arrowPath.value) {
    const dString = `m${props.width / 2},${props.height / 2 - 12}l40,0l0,-15l30,25l-30,25l0,-15l-40,0l0,-20z`;
    arrowPath.value.setAttribute("d", dString);
  }
});

async function handleGridClick(index: number) {
  // Emit the grid click event first
  emit('gridClick', index);
  
  if (props.denyClick === true) {
    return;
  }

  if (props.craftingGrid[index] === null) {
    return;
  }

  if (document.getElementById('mydialog123') !== undefined) {
    modalDialogRef = ref(document.getElementById('mydialog123') as HTMLDialogElement | null);
  }
  
  try {
    // Wait for next tick to ensure DOM is updated
    await nextTick();
    
    if (modalDialogRef.value) {
      isPopupOpen.value = true;
      modalDialogRef.value.showModal();
      
      // Emit popup open event
      emit('popupOpen', index);
      
      // Add click outside listener
      const handleClickOutside = (event: MouseEvent) => {
        if (modalDialogRef.value != undefined) {
          if (event.layerX > modalDialogRef.value.clientWidth || event.layerY > modalDialogRef.value.clientHeight || event.layerX < 0 || event.layerY < 0) {
            closePopup();
          }
        }
      };
      
      // Add escape key listener
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          closePopup();
        }
      };
      
      // Attach listeners
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      
      // Cleanup function
      const cleanup = () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
      };
      
      // Store cleanup function for later use
      (modalDialogRef.value as any)._cleanup = cleanup;
    } else {
      console.error('Modal dialog element not found');
    }
  } catch (error) {
    console.error('Error opening popup:', error);
  }
}

function closePopup() {
  if (modalDialogRef.value) {
    modalDialogRef.value.close();
    isPopupOpen.value = false;
    
    // Emit popup close event
    emit('popupClose');
    
    // Run cleanup if it exists
    if ((modalDialogRef.value as any)._cleanup) {
      (modalDialogRef.value as any)._cleanup();
      delete (modalDialogRef.value as any)._cleanup;
    }
  }
}

const handleSvgClick = () => {};

</script>
