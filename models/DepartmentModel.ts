import { Document, Model, Schema } from "mongoose";
import BaseModel from "./BaseModel";

export interface Department extends BaseModel {
  facultyId: string;
  grade: Number;
}

export interface DepartmentDocument extends Department, Document {
  minify(): unknown;
}

export const DepartmentSchema: Schema = new Schema({
  facultyId: { type: String, required: true },
  grade: { type: Number, required: false, default: 4 },
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
    facultyId: this.facultyId,
    grade: this.grade,
    title: this.title,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
  return response;
};