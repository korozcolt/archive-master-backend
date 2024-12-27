// src/modules/workflow/services/workflow-definition.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinition } from '../entities/workflow-definition.entity';
import { CreateWorkflowDefinitionDto } from '../dto/workflow-definition/create-workflow-definition.dto';
import { UpdateWorkflowDefinitionDto } from '../dto/workflow-definition/update-workflow-definition.dto';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class WorkflowDefinitionService {
  constructor(
    @InjectRepository(WorkflowDefinition)
    private workflowDefinitionRepository: Repository<WorkflowDefinition>,
  ) {}

  async create(createDto: CreateWorkflowDefinitionDto, user: User): Promise<WorkflowDefinition> {
    // Verificar si ya existe un workflow con el mismo código
    const existingWorkflow = await this.workflowDefinitionRepository.findOne({
      where: { code: createDto.code },
    });

    if (existingWorkflow) {
      throw new BadRequestException(`Workflow with code ${createDto.code} already exists`);
    }

    const workflow = this.workflowDefinitionRepository.create({
      ...createDto,
      createdById: user.id,
      updatedById: user.id,
    });

    return this.workflowDefinitionRepository.save(workflow);
  }

  async findAll(): Promise<WorkflowDefinition[]> {
    return this.workflowDefinitionRepository.find({
      relations: ['steps', 'transitions'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<WorkflowDefinition> {
    const workflow = await this.workflowDefinitionRepository.findOne({
      where: { id },
      relations: ['steps', 'transitions', 'steps.status', 'steps.assigneeRole'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow definition with ID ${id} not found`);
    }

    return workflow;
  }

  async update(
    id: string,
    updateDto: UpdateWorkflowDefinitionDto,
    user: User,
  ): Promise<WorkflowDefinition> {
    const workflow = await this.findOne(id);

    // Verificar unicidad del código si se está actualizando
    if (updateDto.code && updateDto.code !== workflow.code) {
      const existingWorkflow = await this.workflowDefinitionRepository.findOne({
        where: { code: updateDto.code },
      });

      if (existingWorkflow) {
        throw new BadRequestException(`Workflow with code ${updateDto.code} already exists`);
      }
    }

    Object.assign(workflow, {
      ...updateDto,
      updatedById: user.id,
    });

    return this.workflowDefinitionRepository.save(workflow);
  }

  async remove(id: string): Promise<void> {
    const workflow = await this.findOne(id);

    // Verificar si hay instancias activas
    const hasActiveInstances = await this.hasActiveInstances(id);
    if (hasActiveInstances) {
      throw new BadRequestException('Cannot delete workflow with active instances');
    }

    await this.workflowDefinitionRepository.remove(workflow);
  }

  private async hasActiveInstances(workflowDefinitionId: string): Promise<boolean> {
    const count = await this.workflowDefinitionRepository
      .createQueryBuilder('wd')
      .leftJoin('wd.instances', 'wi')
      .where('wd.id = :workflowDefinitionId', { workflowDefinitionId })
      .andWhere('wi.status = :status', { status: 'active' })
      .getCount();

    return count > 0;
  }
}
