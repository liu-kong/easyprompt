import { Prompt, CodeGeneration } from '../models';
import { DatabaseManager } from '../database/connection';

export class CodeGenerationService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  async generatePythonCode(tableId: number): Promise<string> {
    const connection = this.dbManager.getConnection('default', 'easyprompt.db');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const tableInfo = await connection('prompt_tables').where('id', tableId).first();
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = await connection('prompts').where('table_id', tableId);

    let code = `"""
Auto-generated Python code for prompt management
Table: ${tableInfo.table_name}
Generated at: ${new Date().toISOString()}
"""

import json
from typing import Dict, Optional, Any
from dataclasses import dataclass

@dataclass
class Prompt:
    code: str
    title: str
    content: str
    version: str
    tags: Optional[str] = None
    is_active: bool = True

class PromptManager:
    def __init__(self):
        self.prompts: Dict[str, Prompt] = {}
        self._load_prompts()
    
    def _load_prompts(self):
        """Load all prompts from the predefined data"""
`;

    for (const prompt of prompts) {
      const escapedContent = prompt.content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      code += `        self.prompts["${prompt.code}"] = Prompt(
            code="${prompt.code}",
            title="${prompt.title}",
            content="${escapedContent}",
            version="${prompt.version}",
            tags="${prompt.tags || ''}",
            is_active=${prompt.is_active}
        )
`;
    }

    code += `
    def get_prompt(self, code: str) -> Optional[Prompt]:
        """Get a prompt by its code"""
        return self.prompts.get(code)
    
    def get_all_prompts(self) -> Dict[str, Prompt]:
        """Get all prompts"""
        return self.prompts
    
    def get_active_prompts(self) -> Dict[str, Prompt]:
        """Get all active prompts"""
        return {code: prompt for code, prompt in self.prompts.items() if prompt.is_active}
    
    def format_prompt(self, code: str, **kwargs) -> Optional[str]:
        """Format a prompt with provided variables"""
        prompt = self.get_prompt(code)
        if not prompt:
            return None
        
        try:
            return prompt.content.format(**kwargs)
        except KeyError as e:
            raise ValueError(f"Missing variable in prompt: {e}")
    
    def search_prompts(self, query: str) -> Dict[str, Prompt]:
        """Search prompts by title, content, or code"""
        query_lower = query.lower()
        return {
            code: prompt for code, prompt in self.prompts.items()
            if (query_lower in prompt.code.lower() or 
                query_lower in prompt.title.lower() or 
                query_lower in prompt.content.lower())
        }

# Usage example
if __name__ == "__main__":
    manager = PromptManager()
    
    # Get a specific prompt
    prompt = manager.get_prompt("example_code")
    if prompt:
        print(f"Title: {prompt.title}")
        print(f"Content: {prompt.content}")
    
    # Format a prompt with variables
    formatted = manager.format_prompt("example_code", name="John", age=30)
    if formatted:
        print(f"Formatted: {formatted}")
`;

    return code;
  }

  async generateJavaCode(tableId: number): Promise<string> {
    const connection = this.dbManager.getConnection('default', 'easyprompt');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const tableInfo = await connection('prompt_tables').where('id', tableId).first();
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = await connection('prompts').where('table_id', tableId);

    let code = `/*
 * Auto-generated Java code for prompt management
 * Table: ${tableInfo.table_name}
 * Generated at: ${new Date().toISOString()}
 */

import java.util.*;
import java.util.stream.Collectors;

public class PromptManager {
    
    public static class Prompt {
        private final String code;
        private final String title;
        private final String content;
        private final String version;
        private final String tags;
        private final boolean isActive;
        
        public Prompt(String code, String title, String content, String version, 
                     String tags, boolean isActive) {
            this.code = code;
            this.title = title;
            this.content = content;
            this.version = version;
            this.tags = tags;
            this.isActive = isActive;
        }
        
        // Getters
        public String getCode() { return code; }
        public String getTitle() { return title; }
        public String getContent() { return content; }
        public String getVersion() { return version; }
        public String getTags() { return tags; }
        public boolean isActive() { return isActive; }
    }
    
    private final Map<String, Prompt> prompts = new HashMap<>();
    
    public PromptManager() {
        loadPrompts();
    }
    
    private void loadPrompts() {
`;

    for (const prompt of prompts) {
      const escapedContent = prompt.content.replace(/"/g, '\\"').replace(/\n/g, '\\n');
      code += `        prompts.put("${prompt.code}", new Prompt(
            "${prompt.code}",
            "${prompt.title}",
            "${escapedContent}",
            "${prompt.version}",
            "${prompt.tags || ''}",
            ${prompt.is_active}
        ));
`;
    }

    code += `    }
    
    public Optional<Prompt> getPrompt(String code) {
        return Optional.ofNullable(prompts.get(code));
    }
    
    public Map<String, Prompt> getAllPrompts() {
        return new HashMap<>(prompts);
    }
    
    public Map<String, Prompt> getActivePrompts() {
        return prompts.entrySet().stream()
            .filter(entry -> entry.getValue().isActive())
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue
            ));
    }
    
    public Optional<String> formatPrompt(String code, Map<String, Object> variables) {
        Optional<Prompt> promptOpt = getPrompt(code);
        if (!promptOpt.isPresent()) {
            return Optional.empty();
        }
        
        String content = promptOpt.get().getContent();
        for (Map.Entry<String, Object> entry : variables.entrySet()) {
            content = content.replace("{" + entry.getKey() + "}", 
                                      String.valueOf(entry.getValue()));
        }
        
        return Optional.of(content);
    }
    
    public Map<String, Prompt> searchPrompts(String query) {
        String queryLower = query.toLowerCase();
        return prompts.entrySet().stream()
            .filter(entry -> {
                Prompt prompt = entry.getValue();
                return prompt.getCode().toLowerCase().contains(queryLower) ||
                       prompt.getTitle().toLowerCase().contains(queryLower) ||
                       prompt.getContent().toLowerCase().contains(queryLower);
            })
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                Map.Entry::getValue
            ));
    }
    
    // Usage example
    public static void main(String[] args) {
        PromptManager manager = new PromptManager();
        
        // Get a specific prompt
        Optional<Prompt> prompt = manager.getPrompt("example_code");
        prompt.ifPresent(p -> {
            System.out.println("Title: " + p.getTitle());
            System.out.println("Content: " + p.getContent());
        });
        
        // Format a prompt with variables
        Map<String, Object> variables = new HashMap<>();
        variables.put("name", "John");
        variables.put("age", 30);
        
        Optional<String> formatted = manager.formatPrompt("example_code", variables);
        formatted.ifPresent(f -> System.out.println("Formatted: " + f));
    }
}
`;

    return code;
  }

  async generateGoCode(tableId: number): Promise<string> {
    const connection = this.dbManager.getConnection('default', 'easyprompt');
    if (!connection) {
      throw new Error('Database connection not found');
    }

    const tableInfo = await connection('prompt_tables').where('id', tableId).first();
    if (!tableInfo) {
      throw new Error('Table not found');
    }

    const prompts = await connection('prompts').where('table_id', tableId);

    let code = `/*
Auto-generated Go code for prompt management
Table: ${tableInfo.table_name}
Generated at: ${new Date().toISOString()}
*/

package main

import (
	"fmt"
	"strings"
	"time"
)

type Prompt struct {
	Code     string
	Title    string
	Content  string
	Version  string
	Tags     string
	IsActive bool
}

type PromptManager struct {
	prompts map[string]Prompt
}

func NewPromptManager() *PromptManager {
	pm := &PromptManager{
		prompts: make(map[string]Prompt),
	}
	pm.loadPrompts()
	return pm
}

func (pm *PromptManager) loadPrompts() {
`;

    for (const prompt of prompts) {
      const escapedContent = prompt.content.replace(/`/g, '` + "`" + `').replace(/\n/g, '\\n');
      code += `	pm.prompts["${prompt.code}"] = Prompt{
		Code:     "${prompt.code}",
		Title:    "${prompt.title}",
		Content:  \`${escapedContent}\`,
		Version:  "${prompt.version}",
		Tags:     "${prompt.tags || ''}",
		IsActive: ${prompt.is_active},
	}
`;
    }

    code += `}

func (pm *PromptManager) GetPrompt(code string) (Prompt, bool) {
	prompt, exists := pm.prompts[code]
	return prompt, exists
}

func (pm *PromptManager) GetAllPrompts() map[string]Prompt {
	result := make(map[string]Prompt)
	for k, v := range pm.prompts {
		result[k] = v
	}
	return result
}

func (pm *PromptManager) GetActivePrompts() map[string]Prompt {
	result := make(map[string]Prompt)
	for k, v := range pm.prompts {
		if v.IsActive {
			result[k] = v
		}
	}
	return result
}

func (pm *PromptManager) FormatPrompt(code string, variables map[string]interface{}) (string, error) {
	prompt, exists := pm.GetPrompt(code)
	if !exists {
		return "", fmt.Errorf("prompt with code %s not found", code)
	}
	
	content := prompt.Content
	for key, value := range variables {
		placeholder := fmt.Sprintf("{%s}", key)
		content = strings.ReplaceAll(content, placeholder, fmt.Sprintf("%v", value))
	}
	
	return content, nil
}

func (pm *PromptManager) SearchPrompts(query string) map[string]Prompt {
	query = strings.ToLower(query)
	result := make(map[string]Prompt)
	
	for code, prompt := range pm.prompts {
		if strings.Contains(strings.ToLower(prompt.Code), query) ||
		   strings.Contains(strings.ToLower(prompt.Title), query) ||
		   strings.Contains(strings.ToLower(prompt.Content), query) {
			result[code] = prompt
		}
	}
	
	return result
}

func main() {
	manager := NewPromptManager()
	
	// Get a specific prompt
	if prompt, exists := manager.GetPrompt("example_code"); exists {
		fmt.Printf("Title: %s\\n", prompt.Title)
		fmt.Printf("Content: %s\\n", prompt.Content)
	}
	
	// Format a prompt with variables
	variables := map[string]interface{}{
		"name": "John",
		"age":  30,
	}
	
	if formatted, err := manager.FormatPrompt("example_code", variables); err == nil {
		fmt.Printf("Formatted: %s\\n", formatted)
	} else {
		fmt.Printf("Error: %v\\n", err)
	}
}
`;

    return code;
  }

  async generateCode(tableId: number, language: 'python' | 'java' | 'go'): Promise<string> {
    switch (language) {
      case 'python':
        return await this.generatePythonCode(tableId);
      case 'java':
        return await this.generateJavaCode(tableId);
      case 'go':
        return await this.generateGoCode(tableId);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  }
}