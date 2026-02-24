<template>
    <div class="result-list-container">
        <div class="result-list-header">
            <h3>猜测历史</h3>
        </div>
        
        <div class="result-list">
            <div 
                v-for="(item, index) in selectedItems" 
                :key="`${item.id}-${index}`"
                class="result-item"
                :class="[{ 'has-steps': item.steps === 2 || item.steps === 1 }, { 'has-steps-0': item.steps === 0 }]"
            >
                <div class="item-icon">
                    <img 
                        :src="getItemIconUrl(item.id)" 
                        :alt="item.name"
                        @error="handleImageError"
                        @load="handleImageLoad"
                    />
                </div>
                <div class="item-info">
                    <div class="item-name">{{ item.name }}</div>
                    <div class="item-chinese">{{ getTranslation(item.id) }}</div>
                </div>
                <div class="step-info">
                    <div class="step-info-item">
                        <div class="step-info-label">距离：</div>
                        <div class="step-info-value">{{ item.steps === -1 ? "远" : item.steps}}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import translations from './en-cn.json';

interface SelectedItem {
    id: string;
    name: string;
    steps: number;
}

const props = defineProps<{
    selectedItems: SelectedItem[];
}>();

const getItemIconUrl = (itemId: string): string => {
    const iconName = `minecraft_${itemId}`;
    return `/icons/${iconName}.png`;
};

const getTranslation = (itemId: string): string => {
    return translations[itemId as keyof typeof translations] || itemId;
};

const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
};

const handleImageLoad = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.style.display = 'block';
};



</script>

<style scoped>
.result-list-container {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    background-color: #fafafa;
    min-height: 200px;
    width: 800px;
    display: table;
    margin: 0 auto;
}

.result-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #eee;
}

.result-list-header h3 {
    margin: 0;
    color: #333;
    font-size: 16px;
}

.clear-all-btn {
    background-color: #ff4444;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.clear-all-btn:hover {
    background-color: #cc0000;
}

.empty-state {
    text-align: center;
    padding: 32px 16px;
    color: #666;
}

.empty-state p {
    margin: 8px 0;
}

.empty-state .hint {
    font-size: 14px;
    color: #999;
}

.result-list {
    max-height: 300px;
    overflow-y: auto;
}

.result-item {
    display: flex;
    align-items: center;
    padding: 12px;
    margin-bottom: 8px;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.result-item.has-steps {
    background-color: rgb(255, 251, 230);
    border-color: rgb(255, 229, 143);
}


.result-item.has-steps-0 {
    background-color: #e8f5e8;
    border-color: #4caf50;
}

.result-item.has-steps:hover {
    background-color: rgb(255, 251, 230);
    border-color: rgb(255, 229, 143);
}


.result-item.has-steps-0:hover {
    background-color: #e8f5e8;
    border-color: #4caf50;
}

.result-item:hover {
    background-color: #f5f5f5;
    border-color: #ccc;
}

.result-item:last-child {
    margin-bottom: 0;
}

.item-icon {
    width: 40px;
    height: 40px;
    margin-right: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background-color: #f8f8f8;
    border-radius: 4px;
}

.item-icon img {
    max-width: 32px;
    max-height: 32px;
    object-fit: contain;
}

.item-info {
    flex: 1;
    min-width: 0;
}

.item-name {
    font-weight: 500;
    color: #333;
    font-size: 14px;
    margin-bottom: 4px;
    text-transform: capitalize;
}

.item-chinese {
    font-size: 12px;
    color: #666;
}

.remove-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #ff4444;
    color: white;
    border-radius: 50%;
    font-size: 16px;
    font-weight: bold;
    flex-shrink: 0;
    transition: background-color 0.2s;
}

.remove-btn:hover {
    background-color: #cc0000;
}

/* Scrollbar styling */
.result-list::-webkit-scrollbar {
    width: 6px;
}

.result-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.result-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.result-list::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
</style>