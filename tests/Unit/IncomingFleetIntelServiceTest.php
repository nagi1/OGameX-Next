<?php

namespace Tests\Unit;

use OGame\Enums\IncomingFleetIntelLevel;
use OGame\GameObjects\Models\Units\UnitCollection;
use OGame\Models\Planet\Coordinate;
use OGame\Models\Resources;
use OGame\Services\IncomingFleetIntelService;
use OGame\Services\ObjectService;
use OGame\ViewModels\FleetEventRowViewModel;
use Tests\TestCase;

class IncomingFleetIntelServiceTest extends TestCase
{
    private IncomingFleetIntelService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new IncomingFleetIntelService();
    }

    public function testFromEspionageLevelThresholds(): void
    {
        $this->assertSame(IncomingFleetIntelLevel::None, IncomingFleetIntelLevel::fromEspionageLevel(0));
        $this->assertSame(IncomingFleetIntelLevel::None, IncomingFleetIntelLevel::fromEspionageLevel(1));
        $this->assertSame(IncomingFleetIntelLevel::TotalCount, IncomingFleetIntelLevel::fromEspionageLevel(2));
        $this->assertSame(IncomingFleetIntelLevel::TotalCount, IncomingFleetIntelLevel::fromEspionageLevel(3));
        $this->assertSame(IncomingFleetIntelLevel::ShipTypes, IncomingFleetIntelLevel::fromEspionageLevel(4));
        $this->assertSame(IncomingFleetIntelLevel::ShipTypes, IncomingFleetIntelLevel::fromEspionageLevel(7));
        $this->assertSame(IncomingFleetIntelLevel::Full, IncomingFleetIntelLevel::fromEspionageLevel(8));
        $this->assertSame(IncomingFleetIntelLevel::Full, IncomingFleetIntelLevel::fromEspionageLevel(15));
    }

    public function testApplyNoneClearsCountUnitsAndShipment(): void
    {
        $row = $this->makeRowWithFleet(5, 100, 50, 25);

        $this->service->apply($row, IncomingFleetIntelLevel::None);

        $this->assertSame(IncomingFleetIntelLevel::None, $row->fleet_intel_level);
        $this->assertFalse($row->show_shipment);
        $this->assertSame(0, $row->fleet_unit_count);
        $this->assertCount(0, $row->fleet_units->units);
        $this->assertSame(0.0, $row->resources->sum());
    }

    public function testApplyTotalCountKeepsCountClearsUnits(): void
    {
        $row = $this->makeRowWithFleet(5, 100, 50, 25);

        $this->service->apply($row, IncomingFleetIntelLevel::TotalCount);

        $this->assertSame(5, $row->fleet_unit_count);
        $this->assertCount(0, $row->fleet_units->units);
        $this->assertFalse($row->show_shipment);
        $this->assertSame(0.0, $row->resources->sum());
    }

    public function testApplyShipTypesKeepsTypesWithZeroAmounts(): void
    {
        $row = $this->makeRowWithFleet(5, 100, 50, 25);

        $this->service->apply($row, IncomingFleetIntelLevel::ShipTypes);

        $this->assertSame(5, $row->fleet_unit_count);
        $this->assertCount(1, $row->fleet_units->units);
        $this->assertSame('light_fighter', $row->fleet_units->units[0]->unitObject->machine_name);
        $this->assertSame(0, $row->fleet_units->units[0]->amount);
        $this->assertFalse($row->show_shipment);
    }

    public function testApplyFullKeepsCompositionHidesShipment(): void
    {
        $row = $this->makeRowWithFleet(5, 100, 50, 25);

        $this->service->apply($row, IncomingFleetIntelLevel::Full);

        $this->assertSame(5, $row->fleet_unit_count);
        $this->assertSame(5, $row->fleet_units->units[0]->amount);
        $this->assertFalse($row->show_shipment);
        $this->assertSame(0.0, $row->resources->sum());
    }

    public function testUnionSummaryCombinesVisibleFleetTypes(): void
    {
        $firstFleet = $this->makeRowWithFleet(5, 0, 0, 0);
        $firstFleet->user_id = 2;
        $firstFleet->player_name = 'First';
        $firstFleet->origin_planet_name = 'First Planet';
        $firstFleet->origin_planet_coords = new Coordinate(1, 1, 1);

        $secondFleet = $this->makeRowWithFleet(2, 0, 0, 0);
        $secondFleet->fleet_units->addUnit(ObjectService::getUnitObjectByMachineName('heavy_fighter'), 3);
        $secondFleet->fleet_unit_count = 5;
        $secondFleet->user_id = 3;
        $secondFleet->player_name = 'Second';
        $secondFleet->origin_planet_name = 'Second Planet';
        $secondFleet->origin_planet_coords = new Coordinate(1, 1, 2);

        $summary = new FleetEventRowViewModel();
        $summary->union_member_fleets = [$firstFleet, $secondFleet];
        $summary->union_player_breakdown = [];

        $this->service->applyToUnionSummary($summary, IncomingFleetIntelLevel::Full, 1);

        $this->assertSame(7, $summary->fleet_units->getAmountByMachineName('light_fighter'));
        $this->assertSame(3, $summary->fleet_units->getAmountByMachineName('heavy_fighter'));
        $this->assertSame(10, $summary->fleet_unit_count);
    }

    public function testFriendlyFleetKeepsCompositionAndRequiresCommanderForShipment(): void
    {
        $withoutCommander = $this->makeRowWithFleet(5, 100, 50, 25);
        $this->service->applyFriendly($withoutCommander, false);

        $this->assertSame(IncomingFleetIntelLevel::Full, $withoutCommander->fleet_intel_level);
        $this->assertSame(5, $withoutCommander->fleet_units->units[0]->amount);
        $this->assertFalse($withoutCommander->show_shipment);
        $this->assertSame(0.0, $withoutCommander->resources->sum());

        $withCommander = $this->makeRowWithFleet(5, 100, 50, 25);
        $this->service->applyFriendly($withCommander, true);

        $this->assertTrue($withCommander->show_shipment);
        $this->assertSame(175.0, $withCommander->resources->sum());
    }

    private function makeRowWithFleet(int $shipCount, int $metal, int $crystal, int $deuterium): FleetEventRowViewModel
    {
        $units = new UnitCollection();
        $units->addUnit(ObjectService::getUnitObjectByMachineName('light_fighter'), $shipCount);

        $row = new FleetEventRowViewModel();
        $row->fleet_unit_count = $shipCount;
        $row->fleet_units = $units;
        $row->resources = new Resources($metal, $crystal, $deuterium, 0);
        $row->union_player_breakdown = [];

        return $row;
    }
}
