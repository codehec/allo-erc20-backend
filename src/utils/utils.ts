import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class Utils {

  ensureDirectoryExists(filePath: string): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  loadFromJsonFile(filePath: string): any[] {
    try {
      this.ensureDirectoryExists(filePath);
      
      if (!fs.existsSync(filePath)) {
        return [];
      }

      const fileContent = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error loading from JSON file`, error.message);
      return [];
    }
  }

  saveToJsonFile(filePath: string, data: any[]): void {
    try {
      this.ensureDirectoryExists(filePath);
      
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.debug(`Saved data`);
    } catch (error) {
      console.error(`Error saving to JSON file`, error.message);
    }
  }

  appendToJsonFile(filePath: string, newItem: any): void {
    try {
      const existingData = this.loadFromJsonFile(filePath);
      existingData.push(newItem);
      this.saveToJsonFile(filePath, existingData);
    } catch (error) {
      console.error(`Error appending to JSON file`, error.message);
    }
  }

  clearJsonFile(filePath: string): void {
    try {
      this.ensureDirectoryExists(filePath);
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      console.log(`Cleared JSON file`);
    } catch (error) {
      console.error(`Error clearing JSON file`, error.message);
      throw error;
    }
  }
}
