import { Document, Schema } from "mongoose";
import BaseEntity from "./BaseEntity";

export interface Department extends BaseEntity {
  facultyId: string;
  grade: Number;
  title: string;
  coverImageUrl: string;
}

export interface DepartmentDocument extends Department, Document {
  minify(): unknown;
}

export const DepartmentSchema: Schema = new Schema({
  facultyId: { type: String, required: true },
  grade: { type: Number, required: true },
  title: { type: String, required: true },
  coverImageUrl: { type: String, required: false, default: null },
});

// Just to prove that hooks are still functioning as expected
DepartmentSchema.pre("save", function (next) {
  //
  next()
})

DepartmentSchema.pre("deleteOne", function (next) {
  //
  next()
});

DepartmentSchema.methods.minify = async function (
  this: DepartmentDocument
) {
  const response: Department & { _id: string } = {
    _id: this._id,
    recordStatus: this.recordStatus,
    facultyId: this.facultyId,
    grade: this.grade,
    title: this.title,
    coverImageUrl: this.coverImageUrl,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};