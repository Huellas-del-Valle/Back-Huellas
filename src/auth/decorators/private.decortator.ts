import { Reflector } from "@nestjs/core";

/**
 * Indica si el ednpoint a nivel metodo o clase requiere autenticación
 */
export const Private = Reflector.createDecorator<void, boolean>({
    transform: () => true
})