<?php

namespace OGame\Models\Concerns;

use OGame\Models\ModuleEntityDataStore;

/**
 * Adds per-entity, module-namespaced key/value storage to a core model.
 *
 * Models should override moduleEntityType() to return a stable entity type
 * (e.g. "player", "planet"). The default is the lowercase class base name.
 */
trait HasModuleData
{
    /**
     * Get the module data store for this entity.
     */
    public function moduleData(string $module): ModuleEntityDataStore
    {
        return new ModuleEntityDataStore($this->moduleEntityType(), (int) $this->getKey(), $module);
    }

    /**
     * The entity type used to namespace the stored data.
     */
    protected function moduleEntityType(): string
    {
        return strtolower(class_basename(static::class));
    }
}
