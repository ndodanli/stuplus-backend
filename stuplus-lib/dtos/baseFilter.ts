import { mapToDTO } from "../utils/general";

export class BaseFilter {
    page: number = 1;
    pageSize: number = 20;
    skip: number = 0;
    take: number = 20;
    lastRecordId: Date | null = null;
    searchTerm: string | null = null;
    constructor(filter: BaseFilter) {
        if (filter.page && filter.pageSize) {
            this.skip = (filter.page - 1) * filter.pageSize;
            this.take = filter.pageSize;
            if (this.take > 100)
                this.take = 100;
        } else if (filter.pageSize) {
            this.take = filter.pageSize;
            if (this.take > 100)
                this.take = 100;
        }

        if (filter.lastRecordId) {
            this.lastRecordId = filter.lastRecordId;
        }
        this.searchTerm = filter.searchTerm;
    }
}