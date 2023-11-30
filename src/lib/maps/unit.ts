import { UnitStateEnum } from "@/lib/enums/unit";
import { UnitStatusInterface } from "@/lib/interfaces/unit";

export const UnitStatusMap: { [key in UnitStateEnum]: UnitStatusInterface } = {
  [UnitStateEnum.INIT]: {
    label: "初始化",
    value: "warning",
  },
  [UnitStateEnum.COMPILING]: {
    label: "编译中",
    value: "processing",
  },
  [UnitStateEnum.AVAILABLE]: {
    label: "可用",
    value: "success",
  },
  [UnitStateEnum.NO_AVAILABLE]: {
    label: "不可用",
    value: "error",
  },
};