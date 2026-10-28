# Clínica Veterinaria Huellas del Valle S.A.S. — Core & Backend

---

##  Nuestra Visión

En el núcleo del sistema **Huellas del Valle**, visualizamos una arquitectura backend moderna y resiliente que funcione como el sistema nervioso central de la clínica veterinaria. No buscamos simplemente almacenar registros, sino garantizar una consistencia estricta de los datos médicos y financieros (garantía ACID), tolerar fallos de conectividad mediante sincronización inteligente y proteger rigurosamente la privacidad de la información bajo los estándares normativos colombianos (Ley 1581 de Habeas Data y Ley 576 de Ética Veterinaria).

---

## Propósito del Sistema

El propósito fundamental de nuestra API y capa de servicios es abstraer la complejidad operativa de la clínica en micro-servicios y módulos altamente cohesionados y desacoplados (construidos con **NestJS** y **TypeScript**). Esto permite que el personal administrativo, los médicos veterinarios y los gestores de inventario interactúen con un sistema transaccional rápido, capaz de procesar consultas complejas, auditorías de cambios y alertas automatizadas sin comprometer el rendimiento global.

---

## Objetivo General

Diseñar e implementar una API RESTful escalable, segura y altamente disponible bajo una arquitectura por capas, capaz de soportar la concurrencia operativa de la clínica veterinaria. El backend asegura la inmutabilidad de los expedientes médicos (sin borrado físico), el control de acceso basado en roles (RBAC), el manejo transaccional estricto en inventario y caja, y la persistencia relacional íntegra mediante **MySQL**, asegurando además un mecanismo de contingencia local ante la pérdida temporal de conectividad con la nube.

---

## Alcance del Sistema: Enfoque de Servidor y Reglas de Negocio

### Lo que el Backend y el Sistema SÍ ejecutan:

* **Inmutabilidad Clínica y Auditoría Obligatoria:** Las historias clínicas y expedientes médicos no pueden ser eliminados físicamente. Cada modificación o acceso genera un registro inmutable en los logs de auditoría (usuario, IP, timestamp y diferencial de cambios).
* **Identificación Única (Anti-Homonymy):** Garantiza un identificador único e inmutable por cada paciente, erradicando conflictos por nombres repetidos (como el caso de estudio "Los Dos Max").
* **Transacciones Atómicas (ACID):** Las operaciones críticas de facturación, caja, cobros y descuento automático de stock en inventario operan bajo transacciones estrictas para evitar inconsistencias financieras.
* **Modo de Contingencia Local & Sincronización:** Soporta persistencia local temporal ante caídas de red, sincronizando automáticamente los cambios con la base de datos central al restablecer la conexión.
* **Motor de Alertas y Tareas Programadas (Cron Jobs):** Ejecución automatizada de procesos diarios para evaluar caducidad de lotes, stock crítico y envío de recordatorios de vacunación/citas por correo electrónico o mensajería.
* **Seguridad y Cifrado:** Autenticación robusta basada en roles (RBAC) y cifrado de credenciales mediante algoritmos de derivación seguros (`bcrypt`).

### Lo que el Backend NO contempla:

* No procesa pagos mediante pasarelas financieras externas en línea de manera autónoma (el registro de pagos y abonos es gestionado directamente por el cajero/recepcionista).
* No permite la alteración o supresión manual de registros históricos por parte de usuarios sin privilegios de auditoría de sistema.
* No realiza diagnósticos médicos automatizados por IA sin la firma y validación explícita del médico veterinario tratante.

---

## Equipo de Desarrollo

* **Thomas Alejandro Moncayo Liñeiro**
* **Danny Andres Solarte Rosero**
