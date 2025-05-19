import { Injectable } from '@nestjs/common';
import { functionSchemas } from '../schemas';
import { ToolSchema } from '../interfaces/tool.interfaces';

@Injectable()
export class ToolsRegistryService {
  private readonly tools: ToolSchema[];

  constructor() {
    this.tools = functionSchemas as ToolSchema[];
  }

  getAllTools(): ToolSchema[] {
    return this.tools;
  }

  getToolByName(name: string): ToolSchema | undefined {
    return this.tools.find((tool) => tool.function.name === name);
  }
}
