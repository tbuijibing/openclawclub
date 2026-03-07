import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './config/database.config';

export const AppDataSource = new DataSource(getDataSourceOptions());
