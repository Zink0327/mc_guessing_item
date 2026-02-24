<template>
  <v-rect
    :x="x" 
    :y="y"
    :width="cellSize" 
    :height="cellSize" 
    :fill="(item !== null ? (isRevealed ? '#e6ffe6' : '#FFFFFF') : '#E0E0E0')"
    stroke="rgba(0,0,0,0.1)" 
    :stroke-width="2" 
    hoverable
    :item-id="item_id" 
  >
    <!-- Conditionally render img only when item exists -->
    <img 
      v-if="item !== null && isRevealed" 
      ref="imageRef" 
      class="mc mc-xl"
      @load="handleImageLoad"
      @error="handleImageError"
    >
  </v-rect>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import vRect from '../common/v-rect.vue';
import type { CraftItem } from '../common/commonType';
import mcGuessServerCommunication from '../serverCommunication';
import { log } from '../common/debug';

const imageRef = ref<HTMLImageElement | null>(null);
const mcsc = new mcGuessServerCommunication();

interface Props {
    index: number;
    item: CraftItem;
    x: number;
    y: number;
    item_id: string;
    revealed?: boolean;
};

let props = withDefaults(defineProps<Props>(), {
    index: -1,
    item: null,
    x: -1,
    y: -1,
    item_id: "",
    revealed: true
});
const isRevealed = ref(props.revealed);

// Image loading handlers
const handleImageLoad = () => {
  log(imageRef.value);
  if (imageRef.value) {
    imageRef.value.style.display = 'block';
  }
  log(`Image loaded successfully for item: ${props.item}`);
};

const handleImageError = async (event: Event) => {
  
  // Hide the image element initially
  if (imageRef.value) {
    imageRef.value.style.display = 'none';
  }
  
  // Check if this is a consolidated item
  const itemId = getItemId();
  if (itemId === null || itemId === "") return;
  console.warn(`Failed to load image for item: ${props.item}`, event);

  try {
    const consolidatedItem = await mcsc.getItemIsConsolidatedItem(itemId);
    
    if (consolidatedItem !== null) {
      // Use the consolidated item ID to load the image
      log(`Found consolidated item: ${itemId} -> ${consolidatedItem}`);
      setImageSource(consolidatedItem);
      if (imageRef.value) {
        imageRef.value.style.display = 'block';
      }
    } else {
      // No consolidated item found, show warning
      console.warn(`No image found for item: ${itemId} and it's not a consolidated item`);
      // Keep image hidden
    }
  } catch (error) {
    console.error(`Error checking consolidated status for ${itemId}:`, error);
    // Keep image hidden on error
  }
};

// Get the actual item ID to use for image source
const getItemId = (): string | null => {
  if (props.item === null) return null;
  
  let baseItemId: string | null = null;
  
  if (typeof props.item === "string") {
    baseItemId = props.item;
  } else if (Array.isArray(props.item) && props.item.length > 0 && props.item[0] && props.item[0] !== "") {
    baseItemId = props.item[0];
  }
  
  if (baseItemId === null) return null;
  
  // Remove "_from_" suffix and everything after it
  const fromIndex = baseItemId.indexOf("_from_");
  if (fromIndex !== -1) {
    baseItemId = baseItemId.substring(0, fromIndex);
  }

  const fromIndex2 = baseItemId.indexOf("dye_");
  if (fromIndex2 !== -1) {
    baseItemId = baseItemId.substring(4);
  }
  
  return baseItemId;
};

// Set image source with proper error handling
const setImageSource = (itemId: string | null) => {
  if (itemId === null || !imageRef.value) {
    return;
  }
  
  const imagePath = `/icons/minecraft_${itemId}.png`;
  imageRef.value.src = imagePath;
  imageRef.value.style.display = 'block';
  log(`Setting image source for ${props.item} to: ${imagePath}`);
};

// Watch for item changes and update image source
watch(() => props.item, (newItem) => {
  // log(`Item changed from ${props.item} to ${newItem}`);
  const itemId = getItemId();
  setImageSource(itemId);
}, { immediate: true });

watch(() => props.revealed, (newRevealed) => {
  // log(`Revealed changed from ${props.revealed} to ${newRevealed}`);
  isRevealed.value = newRevealed;
});

onMounted(() => {
  // log(`Block mounted - index: ${props.index}, item: ${props.item}`);
  const itemId = getItemId();
  if (itemId !== null) {
    setImageSource(itemId);
  }
});

const cellSize = 60;

</script>