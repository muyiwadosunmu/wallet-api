import { Model, Document, PopulateOptions, FilterQuery } from 'mongoose';

export interface IUpdateOne {
  model: Model<Document>;
  id: string;
  updateBody: object;
}

export interface PaginateOption<T> {
  populate?:
    | PopulateOptions[]
    | string[]
    | PopulateOptions
    | string
    | PopulateOptions
    | undefined;
  filter: FilterQuery<T>;
  sort?: string | object;
  select?: string | object;
  lean?: boolean;
}
export interface ISort {
  [x: string]: string;
}
