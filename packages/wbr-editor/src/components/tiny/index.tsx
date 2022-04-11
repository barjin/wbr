import EditableValue from "./EditableValue";
import EditableObject from "./EditableObject";
import EditableArray from "./EditableArray";
import RenderValue from "./RenderValue";

export interface IInputOptions {
    dynamic: boolean
}

export enum DropTypes {
    Pair = "Pair",
}

export {EditableValue, EditableObject, EditableArray, RenderValue};