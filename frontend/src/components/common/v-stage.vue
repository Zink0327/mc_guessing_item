<template>
  <svg 
    ref="svgRef"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    xmlns="http://www.w3.org/2000/svg"
    class="svg-stage"
    @click="handleClick"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
  >
    <!-- 定义滤镜和渐变 -->
    <defs>
      <filter id="dropshadow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
        <feOffset dx="2" dy="2" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.3" />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      
      <linearGradient id="woodGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8B4513" />
        <stop offset="50%" stop-color="#A0522D" />
        <stop offset="100%" stop-color="#8B4513" />
      </linearGradient>
      
      <linearGradient id="stoneGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#696969" />
        <stop offset="50%" stop-color="#808080" />
        <stop offset="100%" stop-color="#696969" />
      </linearGradient>
      
      <pattern id="gridPattern" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="1" />
      </pattern>
    </defs>
    
    <!-- 背景 -->
    <rect 
      :width="width" 
      :height="height" 
      fill="#FFFFFF" 
      filter="url(#dropshadow)"
    />
    
    <!-- 动态渲染所有子元素 -->
    <slot></slot>
  </svg>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue';

const props = defineProps({
  width: { type: [Number, String], default: 800 },
  height: { type: [Number, String], default: 600 }
});

const emit = defineEmits(['click', 'mousemove', 'mouseup']);

const svgRef = ref(null);
const dragging = ref(null);
const dragOffset = ref({ x: 0, y: 0 });

const handleClick = (event) => {
  const rect = svgRef.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  emit('click', { x, y, event });
};

const handleMouseMove = (event) => {
  if (dragging.value) {
    const rect = svgRef.value.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.value.x;
    const y = event.clientY - rect.top - dragOffset.value.y;
    
    dragging.value.onDragMove({ x, y });
  }
  emit('mousemove', event);
};

const handleMouseUp = () => {
  if (dragging.value) {
    dragging.value.onDragEnd();
    dragging.value = null;
  }
  emit('mouseup');
};

const startDrag = (element, startX, startY, elementX, elementY) => {
  dragging.value = element;
  dragOffset.value = {
    x: startX - elementX,
    y: startY - elementY
  };
};

defineExpose({ startDrag });
</script>

<style scoped>
.svg-stage {
  border: 2px solid #654321;
  border-radius: 4px;
  background-color: #8B7355;
  box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.3);
}
</style>