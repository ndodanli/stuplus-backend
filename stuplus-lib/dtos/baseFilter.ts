import { mapToDTO } from "../utils/general";

export class BaseFilter {
    page: number = 1;
    pageSize: number = 20;
    skip: number = 0;
    take: number = 20;
    lastRecordDate: Date | null = null;
    searchTerm: string | null = null;
    constructor(filter: BaseFilter) {
        if (filter.page && filter.pageSize) {
            this.skip = (filter.page - 1) * filter.pageSize;
            this.take = filter.pageSize;
        } else if (filter.pageSize) {
            this.take = filter.pageSize;
        }

        if (filter.lastRecordDate) {
            this.lastRecordDate = filter.lastRecordDate;
        }
        this.searchTerm = filter.searchTerm;
    }
}