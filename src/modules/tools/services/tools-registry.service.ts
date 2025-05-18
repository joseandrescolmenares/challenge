import { Injectable } from '@nestjs/common';
import { functionSchemas } from '../schemas';

@Injectable()
export class ToolsRegistryService {
  private readonly tools: any[];

  constructor() {
    this.tools = functionSchemas;
  }

  getAllTools() {
    return this.tools;
  }

  getToolByName(name: string) {
    return this.tools.find((tool) => tool.name === name);
  }
}
