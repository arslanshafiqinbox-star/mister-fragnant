import { createNamedEntityCrud } from "@/lib/named-entity-crud";

export const { GET, POST, PUT, DELETE } = createNamedEntityCrud("scent_type");
