import React, { useEffect, useState } from "react";
import { NavBarPopover } from "../../../header/navigation/NavBarPopover";

const MegaMenu: React.FC<{
  data: any;
}> = ({ data }) => {
  return data && <NavBarPopover nav={data} />;
};

export default MegaMenu;
