import type { CraftingGrid } from "./common/commonType";
import { log } from "./common/debug";

// use HTTP api
class mcGuessServerCommunication { 
    private baseUrl: string;

    constructor(baseUrl: string = 'http://localhost:4000/api') {
        this.baseUrl = baseUrl;
    }

    public async getMainCraftingGrid(): Promise<any> {
        try {
            const response = await this.get('/crafting/main-grid', {});
            log('Main crafting grid:', response.grid);
            return response as any;
        } catch (error) {
            console.error('Error fetching main crafting grid:', error);
            throw error;
        }
    }

    public async getCraftingGrid(item: string): Promise<CraftingGrid> {
        log('Getting crafting grid for:', item);
        try {
            const response = await this.get(`/crafting/grid/${encodeURIComponent(item)}`, {});
            return response.grid as CraftingGrid;
        } catch (error) {
            console.error(`Error fetching crafting grid for ${item}:`, error);
            throw error;
        }
    }

    // Get how many steps it takes to craft `dist` from `item`. 0 if item === dist. null if steps >= 3
    public async getCraftingSteps(item: string, dist: string): Promise<number | null> {
        try {
            const response = await this.get(`/crafting/steps`, { 
                item: encodeURIComponent(item), 
                dist: encodeURIComponent(dist) 
            });
            return response.steps as number | null;
        } catch (error) {
            console.error(`Error fetching crafting steps from ${item} to ${dist}:`, error);
            throw error;
        }
    }

    public async getItemIcon(item: string) : Promise<string | null> {
        try {
            const response = await this.get(`/item/icon/${encodeURIComponent(item)}`, {});
            return response.icon as string | null;
        } catch (error) {
            console.error(`Error fetching icon for ${item}:`, error);
            throw error;
        }
    }

    public async getItemIsConsolidatedItem(item: string): Promise<string | null> {
        try {
            const response = await this.get(`/item/is-consolidated/${encodeURIComponent(item)}`, {});
            //log('Is consolidated response:', response);
            // Return the actual item ID if found, null otherwise
            return response.isConsolidated as string | null;
        } catch (error) {
            console.error(`Error fetching consolidated status for ${item}:`, error);
            return null; // Return null on error instead of throwing
        }
    }

    public async getItemCategory(item: string) : Promise<string | null> {
        try {
            const response = await this.get(`/item/get-category/${encodeURIComponent(item)}`, {});
            //log('Category response:', response);
            // Return the actual item ID if found, null otherwise
            return response.category as string | null;
        } catch (error) {
            console.error(`Error fetching category for ${item}:`, error);
            return null; // Return null on error instead of throwing
        }
    }

    private async get(endpoint: string, params: any): Promise<any> {
        try {
            const queryString = new URLSearchParams(params).toString();
            const url = `${this.baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
            
            log('Making GET request to:', url); // 添加调试日志
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            //log('Response status:', response.status); // 添加响应状态日志
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const textResponse = await response.text();
            log('Raw response:', textResponse); // 添加原始响应日志
            
            // 检查响应是否为空
            if (!textResponse.trim()) {
                throw new Error('Empty response received from server');
            }

            try {
                return JSON.parse(textResponse);
            } catch (parseError) {
                console.error('JSON parsing failed:', parseError);
                console.error('Response text was:', textResponse);
                throw new Error(`Invalid JSON response: ${textResponse.substring(0, 100)}...`);
            }
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    }

    private async post(endpoint: string, params: any): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    }
}

export default mcGuessServerCommunication;