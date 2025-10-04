/* eslint-disable @typescript-eslint/ban-types */
import { Injectable } from '@nestjs/common';
import mongoose, {
  FilterQuery,
  Model,
  PaginateModel,
  PaginateOptions,
  Types,
  UpdateQuery,
} from 'mongoose';
import { IPaginateResult } from './interface/paginate-labels.constant';
import { PaginateOption, ISort } from './interface/crud-helper.interface';

@Injectable()
export class CRUDHelper {
  /**
   *
   * @method updateQuery
   * @param {Document} model mongoose model
   * @param  {string} id id of the record
   * @param {buldUpdateBody} updateBody return value of buildUpdateBody
   *
   * @returns Document
   */
  async updateById<T>(
    model: Model<T>,
    id: string | Types.ObjectId,
    updateBody: UpdateQuery<T>,
    session: mongoose.ClientSession | null = null,
  ): Promise<T> {
    // update record
    return await model
      .findOneAndUpdate({ _id: id }, updateBody, { new: true })
      .session(session);
  }
  /** 
   @method updateQuery
   * @param {Document} model mongoose model
   * @param  {string} filter filter condition of the record
   * @param {buldUpdateBody} updateBody return value of buildUpdateBody
   *
   * @returns Document
   * **/
  async updateWhere<T>(
    model: Model<T>,
    filter: FilterQuery<T>,
    updateBody: Partial<T>,
    session: mongoose.ClientSession | null = null,
  ): Promise<T> {
    // update record
    return await model
      .findOneAndUpdate(filter, updateBody, { new: true })
      .session(session);
  }

  /**
   *
   * @param {model} model  the model you want to query
   * @param query query parameters for filter
   * @param option
   * @description used to paginate
   * @returns
   */
  async paginateFind<T>(
    model: PaginateModel<T>,
    option: PaginateOption<T>,
  ): Promise<IPaginateResult<T>> {
    let page: number;
    let limit: number;

    // Remove any filter with undefined
    if (option?.filter) {
      for (const [key, value] of Object.entries(option.filter)) {
        if (value === undefined) delete option.filter[key];
      }

      if (option.filter['page']) page = option.filter['page'];
      if (option.filter['limit']) limit = option.filter['limit'];
      delete option.filter['page'];
      delete option.filter['limit'];
    }

    // Populate option with lean support
    const paginateOption: PaginateOptions = {
      populate: option?.populate,
      sort: option?.sort ?? '-createdAt',
      page: +page || 1,
      limit: +limit || 10,
      select: option?.select,
      lean: option?.lean ?? false,
    };

    const { docs, ...others } = await model.paginate(
      option?.filter,
      paginateOption,
    );

    return { meta: { ...others }, docs };
  }

  /**
   *
   * @param sortFields sort fields
   * @returns
   */
  sortFields(sortFields: ISort) {
    const sortQuery = { createdAt: '-1' };
    for (const [key, value] of Object.entries(sortFields)) {
      sortQuery[key] = value === 'ASC' ? '1' : '-1';
    }

    return sortQuery;
  }
}
