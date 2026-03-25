import { createContext, useContext } from "react";

export const FarmContext = createContext();

export const useFarm = () => useContext(FarmContext);