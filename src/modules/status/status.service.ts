import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Status } from './entities/status.entity';
import { StatusTransition } from './entities/status-transition.entity';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateStatusTransitionDto } from './dto/create-status-transition.dto';
import { UpdateStatusTransitionDto } from './dto/update-status-transition.dto';
import { StatusTransitionRequestDto } from './dto/status-transition-request.dto';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Status)
    private statusRepository: Repository<Status>,
    @InjectRepository(StatusTransition)
    private transitionRepository: Repository<StatusTransition>,
  ) {}

  async createStatus(createStatusDto: CreateStatusDto, userId: string): Promise<Status> {
    const existingStatus = await this.statusRepository.findOne({
      where: [{ code: createStatusDto.code }, { name: createStatusDto.name }],
    });

    if (existingStatus) {
      throw new BadRequestException('Status with this code or name already exists');
    }

    const status = this.statusRepository.create({
      ...createStatusDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.statusRepository.save(status);
  }

  async findAllStatus(): Promise<Status[]> {
    return this.statusRepository.find({
      relations: ['transitionsFrom', 'transitionsTo'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findOneStatus(id: string): Promise<Status> {
    const status = await this.statusRepository.findOne({
      where: { id },
      relations: ['transitionsFrom', 'transitionsTo'],
    });

    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    return status;
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    userId: string,
  ): Promise<Status> {
    const status = await this.findOneStatus(id);

    if (updateStatusDto.code || updateStatusDto.name) {
      const existingStatus = await this.statusRepository.findOne({
        where: [
          updateStatusDto.code
            ? {
                code: updateStatusDto.code,
                id: Not(id),
              }
            : undefined,
          updateStatusDto.name
            ? {
                name: updateStatusDto.name,
                id: Not(id),
              }
            : undefined,
        ].filter(Boolean),
      });

      if (existingStatus) {
        throw new BadRequestException('Status with this code or name already exists');
      }
    }

    Object.assign(status, {
      ...updateStatusDto,
      updatedById: userId,
    });

    return this.statusRepository.save(status);
  }

  async removeStatus(id: string): Promise<void> {
    const status = await this.findOneStatus(id);

    // Verificar si hay transiciones que usan este estado
    const hasTransitions = await this.transitionRepository.findOne({
      where: [{ fromStatusId: id }, { toStatusId: id }],
    });

    if (hasTransitions) {
      throw new BadRequestException('Cannot delete status that is used in transitions');
    }

    await this.statusRepository.remove(status);
  }

  // Status Transitions
  async createTransition(
    createTransitionDto: CreateStatusTransitionDto,
    userId: string,
  ): Promise<StatusTransition> {
    // Validar estados
    if (createTransitionDto.fromStatusId) {
      await this.findOneStatus(createTransitionDto.fromStatusId);
    }
    await this.findOneStatus(createTransitionDto.toStatusId);

    // Verificar que no exista la misma transición
    const existingTransition = await this.transitionRepository.findOne({
      where: {
        fromStatusId: createTransitionDto.fromStatusId,
        toStatusId: createTransitionDto.toStatusId,
      },
    });

    if (existingTransition) {
      throw new BadRequestException('This transition already exists');
    }

    const transition = this.transitionRepository.create({
      ...createTransitionDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.transitionRepository.save(transition);
  }

  async findAllTransitions(): Promise<StatusTransition[]> {
    return this.transitionRepository.find({
      relations: ['fromStatus', 'toStatus', 'requiredRole'],
    });
  }

  async findOneTransition(id: string): Promise<StatusTransition> {
    const transition = await this.transitionRepository.findOne({
      where: { id },
      relations: ['fromStatus', 'toStatus', 'requiredRole'],
    });

    if (!transition) {
      throw new NotFoundException(`Status transition with ID ${id} not found`);
    }

    return transition;
  }

  async updateTransition(
    id: string,
    updateTransitionDto: UpdateStatusTransitionDto,
    userId: string,
  ): Promise<StatusTransition> {
    const transition = await this.findOneTransition(id);

    if (updateTransitionDto.fromStatusId) {
      await this.findOneStatus(updateTransitionDto.fromStatusId);
    }
    if (updateTransitionDto.toStatusId) {
      await this.findOneStatus(updateTransitionDto.toStatusId);
    }

    Object.assign(transition, {
      ...updateTransitionDto,
      updatedById: userId,
    });

    return this.transitionRepository.save(transition);
  }

  async removeTransition(id: string): Promise<void> {
    const transition = await this.findOneTransition(id);
    await this.transitionRepository.remove(transition);
  }

  // Status Transition Validation
  async validateTransition(
    fromStatusId: string | null,
    toStatusId: string,
    userRole: Role,
    transitionRequest?: StatusTransitionRequestDto,
  ): Promise<boolean> {
    const transition = await this.transitionRepository.findOne({
      where: {
        fromStatusId: fromStatusId || null,
        toStatusId,
        isActive: true,
      },
      relations: ['requiredRole'],
    });

    if (!transition) {
      throw new BadRequestException('Invalid status transition');
    }

    if (transition.requiredRole && transition.requiredRole.id !== userRole.id) {
      throw new ForbiddenException('User role not authorized for this transition');
    }

    if (transition.requiresComment && !transitionRequest?.comment) {
      throw new BadRequestException('This transition requires a comment');
    }

    return true;
  }

  // Helper methods
  async getAvailableTransitions(
    currentStatusId: string | null,
    userRole: Role,
  ): Promise<StatusTransition[]> {
    const transitions = await this.transitionRepository.find({
      where: {
        fromStatusId: currentStatusId || null,
        isActive: true,
      },
      relations: ['toStatus', 'requiredRole'],
    });

    return transitions.filter(
      (transition) => !transition.requiredRole || transition.requiredRole.id === userRole.id,
    );
  }
}
