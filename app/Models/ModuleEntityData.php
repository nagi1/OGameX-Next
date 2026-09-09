<?php

namespace OGame\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Model;

/**
 * Module-owned key/value data attached to a core entity (player, planet, …).
 *
 * Data is namespaced by module alias and entity type/id so modules can never
 * read or overwrite each other's keys.
 *
 * @property int $id
 * @property string $entity_type
 * @property int $entity_id
 * @property string $module
 * @property string $key
 * @property mixed $value
 */
#[Fillable([
    'entity_type',
    'entity_id',
    'module',
    'key',
    'value',
])]
#[Table(name: 'module_entity_data')]
class ModuleEntityData extends Model
{
    /**
     * The attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }
}
