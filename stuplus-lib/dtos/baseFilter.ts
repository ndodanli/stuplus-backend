import { mapToDTO } from "../utils/general";

export class BaseFilter {
    page: number = 1;
    pageSize: number = 10;
    skip: number = 0;
    take: number = 0;
    constructor({ page, pageSize }: BaseFilter) {
        this.skip = (page - 1) * pageSize;
        this.take = pageSize;
    }
}