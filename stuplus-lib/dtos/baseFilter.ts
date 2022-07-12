import { mapToDTO } from "../utils/general";

export class BaseFilter {
    page: number = 1;
    pageSize: number = 20;
    skip: number = 0;
    take: number = 0;
    lastRecordDate: Date | null = null;
    constructor(filter: BaseFilter) {
        // if (filter.page && filter.pageSize) {
        //     this.skip = (filter.page - 1) * filter.pageSize;
        //     this.take = filter.pageSize;
        // }
        if (filter.pageSize) {
            this.take = filter.pageSize;
        } else {
            this.take = 20;
        }
        if (filter.lastRecordDate) {
            this.lastRecordDate = filter.lastRecordDate;
        }
    }
}