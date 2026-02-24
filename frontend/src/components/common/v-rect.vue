<template>
  <g 
    ref="rectGroup"
    :transform="`translate(${x}, ${y})`"
    @mousedown="handleMouseDown"
    @click.stop="handleClick"
    class="svg-rect-container"
    :class="{ 'is-draggable': draggable, 'is-dragging': isDragging }"
  >
    <!-- 主矩形 -->
    <rect
      :width="width"
      :height="height"
      :rx="cornerRadius"
      :ry="cornerRadius"
      :fill="fill"
      :stroke="stroke"
      :stroke-width="strokeWidth"
      class="svg-rect-main"
    />
    
    <!-- 内阴影效果 -->
    <rect
      v-if="showInnerShadow"
      :width="width"
      :height="height"
      :rx="cornerRadius"
      :ry="cornerRadius"
      fill="transparent"
      stroke="rgba(0,0,0,0.2)"
      stroke-width="2"
      class="svg-rect-inner-shadow"
    />
    
    <!-- 高亮边框 -->
    <rect
      v-if="isHovered && hoverable"
      :width="width"
      :height="height"
      :rx="cornerRadius"
      :ry="cornerRadius"
      fill="transparent"
      stroke="#FFD700"
      stroke-width="3"
      stroke-dasharray="5,3"
      class="svg-rect-hover-border"
    />
    
    <!-- 内容插槽 -->
    <foreignObject 
      v-if="$slots.default"
      :width="width"
      :height="height"
      style="pointer-events: none;"
    >
      <div xmlns="http://www.w3.org/1999/xhtml" class="rect-content">
        <slot></slot>
      </div>
    </foreignObject>
    
    <!-- 文本标签 -->
    <text
      v-if="label"
      :x="width / 2"
      :y="height / 2"
      text-anchor="middle"
      dominant-baseline="middle"
      :fill="textColor"
      :font-size="fontSize"
      class="rect-label"
    >
      {{ label }}
    </text>
  </g>
</template>

<script setup>
import { ref, computed, inject, defineProps, defineEmits } from 'vue';

const props = defineProps({
  x: { type: [Number, String], default: 0 },
  y: { type: [Number, String], default: 0 },
  width: { type: [Number, String], default: 100 },
  height: { type: [Number, String], default: 60 },
  fill: { type: String, default: '#8B4513' },
  stroke: { type: String, default: '#654321' },
  strokeWidth: { type: [Number, String], default: 2 },
  cornerRadius: { type: [Number, String], default: 0 },
  draggable: { type: Boolean, default: false },
  hoverable: { type: Boolean, default: true },
  label: String,
  textColor: { type: String, default: '#FFFFFF' },
  fontSize: { type: [Number, String], default: 14 },
  showInnerShadow: { type: Boolean, default: true },
  itemType: String,
  itemId: [String, Number]
});

const emit = defineEmits(['click', 'drag-start', 'drag-move', 'drag-end']);

const rectGroup = ref(null);
const isDragging = ref(false);
const isHovered = ref(false);

const stage = inject('svgStage', null);

const handleMouseDown = (event) => {
  if (props.draggable && stage) {
    event.stopPropagation();
    const rect = rectGroup.value.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    
    isDragging.value = true;
    emit('drag-start', { x: props.x, y: props.y, event });
    
    stage.startDrag({
      onDragMove: ({ x, y }) => {
        emit('drag-move', { x, y });
      },
      onDragEnd: () => {
        isDragging.value = false;
        emit('drag-end');
      }
    }, startX, startY, rect.left, rect.top);
  }
};

const handleClick = (event) => {
  event.stopPropagation();
  emit('click', { 
    x: props.x, 
    y: props.y,
    itemType: props.itemType,
    itemId: props.itemId,
    event 
  });
};

// 提供矩形边界检查方法
const containsPoint = (pointX, pointY) => {
  return (
    pointX >= props.x &&
    pointX <= props.x + props.width &&
    pointY >= props.y &&
    pointY <= props.y + props.height
  );
};

defineExpose({ containsPoint });
</script>

<style scoped>
.svg-rect-container {
  cursor: default;
  transition: filter 0.2s;
}

.svg-rect-container.is-draggable {
  cursor: grab;
}

.svg-rect-container.is-draggable:hover {
  filter: brightness(1.1);
}

.svg-rect-container.is-dragging {
  cursor: grabbing;
  filter: brightness(1.2) drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

.rect-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.rect-label {
  pointer-events: none;
  user-select: none;
  font-family: 'Minecraft', monospace;
  font-weight: bold;
}
</style>