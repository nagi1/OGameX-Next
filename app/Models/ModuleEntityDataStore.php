<?php

namespace OGame\Models;

/**
 * Read/write access to a module's data for one entity.
 *
 * Instances are created via the HasModuleData trait on core models, e.g.
 * `$user->moduleData('myfeature')`.
 */
class ModuleEntityDataStore
{
    public function __construct(
        private string $entityType,
        private int $entityId,
        private string $module,
    ) {
    }

    /**
     * Get a single value, or null when the key does not exist.
     */
    public function get(string $key): mixed
    {
        return ModuleEntityData::query()
            ->where('entity_type', $this->entityType)
            ->where('entity_id', $this->entityId)
            ->where('module', $this->module)
            ->where('key', $key)
            ->first()?->value;
    }

    /**
     * Upsert a single value.
     */
    public function set(string $key, mixed $value): void
    {
        ModuleEntityData::query()->updateOrCreate(
            [
                'entity_type' => $this->entityType,
                'entity_id' => $this->entityId,
                'module' => $this->module,
                'key' => $key,
            ],
            ['value' => $value],
        );
    }

    /**
     * Delete a single key.
     */
    public function forget(string $key): void
    {
        ModuleEntityData::query()
            ->where('entity_type', $this->entityType)
            ->where('entity_id', $this->entityId)
            ->where('module', $this->module)
            ->where('key', $key)
            ->delete();
    }

    /**
     * All key/value pairs for this entity and module.
     *
     * @return array<string, mixed>
     */
    public function all(): array
    {
        return ModuleEntityData::query()
            ->where('entity_type', $this->entityType)
            ->where('entity_id', $this->entityId)
            ->where('module', $this->module)
            ->get()
            ->mapWithKeys(static fn (ModuleEntityData $row): array => [$row->key => $row->value])
            ->all();
    }
}
