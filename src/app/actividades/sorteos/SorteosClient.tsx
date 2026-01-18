"use client";

import { useEffect, useState } from "react";
import SorteosView from "./SorteosView";
import { fetchSorteos } from "@/services/sorteo.client";

export default function SorteosClient() {
  const [anio, setAnio] = useState<number | null>(null);
  const [sorteos, setSorteos] = useState([]);

  useEffect(() => {
    fetchSorteos(anio).then(setSorteos);
  }, [anio]);

  return (
    <SorteosView
      sorteos={sorteos}
      onChangeAnio={setAnio}
    />
  );
}
