import { CategoryResponseDto } from './category-response.dto';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class CategoryTreeDto extends CategoryResponseDto {
  @ValidateNested({ each: true })
  @Type(() => CategoryTreeDto)
  children: CategoryTreeDto[];
}
