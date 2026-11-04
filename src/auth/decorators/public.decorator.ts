import { Reflector } from "@nestjs/core";


/**
 * Decorador que indica si el endpoint a nivel metodo o clase es público
 */
export const Public = Reflector.createDecorator<void, boolean>({
    transform: () => true
})