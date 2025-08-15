# Messaging Patterns

This document outlines recommended messaging patterns for distributed systems.

## Publish/Subscribe

In the **pub/sub** model, producers publish events to a topic without knowledge of the consumers. Subscribers express interest in specific topics and receive relevant events. This pattern enables loose coupling and horizontal scaling.

## Command

A **command** conveys an explicit request for an action. Unlike events, commands target a single receiver that is responsible for handling the request. Use commands when you need strict control flow or acknowledgement from a specific service.

## Saga

A **saga** coordinates a long‑running transaction across multiple services using a series of local transactions and compensating actions. Each step publishes events or commands that trigger the next step. If a step fails, compensating commands roll back previous actions to maintain consistency.

## Module status events

The module orchestrator emits events to notify other services when module availability changes:

- `module.online` – published after a successful ping.
- `module.offline` – published when a module becomes unreachable.
- `module.removed` – published when a module is pruned for being offline too long.

Each event payload contains the `moduleId` of the affected module.
