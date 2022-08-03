import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface SearchHistory extends BaseEntity {
  ownerId: string; // user id
  searchTerm: string;
  searchedEntities: number[];
  foundedCount: number;
}

export interface SearchHistoryDocument extends SearchHistory, Document {
  minify(): unknown;
}

export const SearchHistorySchema: Schema = new Schema({
  ownerId: { type: String, required: true },
  searchTerm: { type: String, required: true },
  searchedEntities: { type: Array.of(Number), required: true },
  foundedCount: { type: Number, required: true },
});

SearchHistorySchema.index({ recordStatus: -1 });

SearchHistorySchema.pre("save", function (next) {
  //
  next()
})

SearchHistorySchema.pre("deleteOne", function (next) {
  //
  next()
});

SearchHistorySchema.methods.minify = async function (
  this: SearchHistoryDocument
) {
  const response: SearchHistory & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    recordDeletionDate: this.recordDeletionDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    ownerId: this.ownerId,
    searchTerm: this.searchTerm,
    searchedEntities: this.searchedEntities,
    foundedCount: this.foundedCount,
  };
  return response;
};