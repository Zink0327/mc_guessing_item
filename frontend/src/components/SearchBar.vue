<template>
    <div class="app-container">
        <button ref="triggerButtonRef" class="searchBtn" @click="handleClick()">猜测</button>
        <div v-if="isPopupOpen" class="modal-backdrop" @click="handleBackdropClick">
            <div class="search-popup" id="blahblahblah" :key="cfKey" @click.stop>
                <div class="popup-content">
                    <h3>{{ searchText ? '筛选结果' : '所有物品' }}</h3>
                    <input 
                        v-model="searchText" 
                        @input="handleInput" 
                        placeholder="输入字母筛选物品（留空显示全部）" 
                        ref="searchInputRef"
                        @keydown="handleKeydown"
                    >
                    <div class="search-results" v-if="searchResults.length > 0">
                        <div 
                            v-for="result in searchResults" 
                            :key="result.id"
                            class="search-result-item"
                            @click="selectItem(result)"
                        >
                            <div class="item-icon">
                                <img 
                                    :src="getItemIconUrl(result.id)" 
                                    :alt="result.name"
                                    @error="handleImageError"
                                    @load="handleImageLoad"
                                    v-if="result.id"
                                />
                            </div>
                            <div class="item-info">
                                <div class="item-name">{{ result.name }}</div>
                                <div class="item-chinese">{{ getTranslation(result.id) }}</div>
                            </div>
                        </div>
                    </div>
                    <div class="no-results" v-else-if="searchText && searchResults.length === 0">
                        未找到包含 "{{ searchText }}" 的物品
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import translations from './en-cn.json';
import mcGuessServerCommunication from './serverCommunication';
import { log } from './common/debug';

const emit = defineEmits<{
    (e: 'item-selected', item: SearchResult): void;
}>();

interface SearchResult {
    id: string;
    name: string;
    steps: number;
}

const modelDialogRef = ref<HTMLDivElement | null>(null);
const triggerButtonRef = ref<HTMLButtonElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const isPopupOpen = ref<boolean>(false);
const searchText = ref<string>('');
const searchResults = ref<SearchResult[]>([]);

const cfKey = ref(0);

const mcsc = new mcGuessServerCommunication();

// Add mounted hook to verify dialog reference
onMounted(() => {
    log('Dialog ref on mount:', modelDialogRef.value);
    cfKey.value++;
});

const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    searchText.value = target.value;
    performSearch();
};

const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        closePopup();
    } else if (event.key === 'Enter' && searchResults.value[0]) {
        selectItem(searchResults.value[0]);
    }
};

const handleBackdropClick = () => {
    closePopup();
};

function closePopup() {
    isPopupOpen.value = false;
    searchText.value = '';
    searchResults.value = [];
    
    // Remove any existing event listeners
    document.removeEventListener('keydown', handleGlobalEscape);
}

function handleGlobalEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        closePopup();
    }
}

async function handleClick() {
    log('Button clicked');
    isPopupOpen.value = true;
    
    // Wait for DOM update then focus input
    await nextTick();
    if (searchInputRef.value) {
        setTimeout(() => {
            searchInputRef.value?.focus();
        }, 100);
    }
    
    // Add escape key listener
    document.addEventListener('keydown', handleGlobalEscape);
}

// Local search implementation
const performSearch = () => {
    const query = searchText.value.trim().toLowerCase();
    const results: SearchResult[] = [];
    // Show more items when no filter is applied
    const limit = 9999; // Show 50 items when no filter, 10 when filtered

    // Search through all translations
    for (const [englishName, chineseName] of Object.entries(translations)) {
        const englishLower = englishName.toLowerCase();
        const chineseLower = chineseName.toLowerCase();
        
        // If query is empty, include all items
        // If query exists, only include items that contain the query
        if (!query || englishLower.includes(query) || chineseLower.includes(query)) {
            results.push({
                id: englishName,
                name: englishName.replace(/_/g, ' '),
                steps: -1
            });
            
            if (results.length >= limit) break;
        }
    }

    // Sort results: exact matches first, then partial matches, then alphabetical
    results.sort((a, b) => {
        const aEnglish = a.id.toLowerCase();
        const bEnglish = b.id.toLowerCase();
        const aChinese = (getTranslation(a.id) || '').toLowerCase();
        const bChinese = (getTranslation(b.id) || '').toLowerCase();
        
        // If no query, sort alphabetically
        if (!query) {
            return aEnglish.localeCompare(bEnglish);
        }
        
        const queryLower = query.toLowerCase();

        // Exact matches first
        if (aEnglish === queryLower || aChinese === queryLower) return -1;
        if (bEnglish === queryLower || bChinese === queryLower) return 1;

        // Then starts with matches
        if (aEnglish.startsWith(queryLower) || aChinese.startsWith(queryLower)) return -1;
        if (bEnglish.startsWith(queryLower) || bChinese.startsWith(queryLower)) return 1;

        // Then contains matches
        return 0;
    });

    searchResults.value = results;
};

const selectItem = async (item: SearchResult) => {
    
    log('Selected item:', item);
    // Emit event for parent component to handle
    emit('item-selected', item);
    closePopup();
};

const getItemIconUrl = (itemId: string): string => {
    // Convert item ID to match icon filename format (replace underscores with spaces and add minecraft_ prefix)
    const iconName = `minecraft_${itemId}`;
    return `/icons/${iconName}.png`;
};

const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    // Hide the broken image and show a placeholder or fallback
    img.style.display = 'none';
    // Optionally add a fallback element or class
    const parent = img.parentElement;
    if (parent) {
        parent.classList.add('image-error');
    }
};

const handleImageLoad = (event: Event) => {
    const img = event.target as HTMLImageElement;
    img.style.display = 'block';
    // Remove error class if it was added
    const parent = img.parentElement;
    if (parent) {
        parent.classList.remove('image-error');
    }
};

const getTranslation = (itemId: string): string => {
    return translations[itemId as keyof typeof translations] || itemId;
};
</script>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.search-popup {
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  padding: 20px;
  min-width: 400px;
  background: white;
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
}

.popup-content h3 {
  margin-top: 0;
  color: #333;
  text-align: left;
}

.popup-content input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  margin-bottom: 10px;
}

.search-results {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.search-result-item:last-child {
  border-bottom: none;
}

.item-icon {
  width: 32px;
  height: 32px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-icon img {
  max-width: 32px;
  max-height: 32px;
  object-fit: contain;
}

.item-icon.image-error {
  background-color: #f0f0f0;
  border-radius: 4px;
  position: relative;
}

.item-icon.image-error::after {
  content: "?";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #999;
  font-weight: bold;
  font-size: 16px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  text-transform: capitalize;
}

.item-chinese {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.searchBtn {
  width: 60%;
  padding: 10px 20px;
  background-color: #e0e0e0;
  color: black;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  display: inline-block;
  margin: 0 auto;
}

.searchBtn:hover {
  background-color: #c9c9c9;
}
</style>