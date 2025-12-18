<template>
  <div v-if="hasSpecs">
    <!-- Series/Generation Badge -->
    <div v-if="series || generation" class="mb-4">
      <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        {{ series }}{{ generation ? ` • ${generation}` : '' }}
      </span>
    </div>

    <!-- Engine & Performance -->
    <div v-if="hasEngineSpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Engine & Performance
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.engine?.type" label="Engine Type" :value="specs.engine.type" />
        <SpecItem v-if="specs.engine?.displacement" label="Displacement" :value="specs.engine.displacement" />
        <SpecItem v-if="specs.engine?.cylinders" label="Cylinders" :value="String(specs.engine.cylinders)" />
        <SpecItem v-if="specs.engine?.configuration" label="Configuration" :value="specs.engine.configuration" />
        <SpecItem v-if="specs.engine?.aspiration" label="Aspiration" :value="specs.engine.aspiration" />
        <SpecItem v-if="specs.engine?.powerKw" label="Power" :value="`${specs.engine.powerKw} kW`" :secondary="specs.engine.powerHp ? `${specs.engine.powerHp} hp` : undefined" highlight />
        <SpecItem v-if="specs.engine?.powerRpm" label="Power @ RPM" :value="specs.engine.powerRpm" />
        <SpecItem v-if="specs.engine?.torqueNm" label="Torque" :value="`${specs.engine.torqueNm} Nm`" highlight />
        <SpecItem v-if="specs.engine?.torqueRpm" label="Torque @ RPM" :value="specs.engine.torqueRpm" />
        <SpecItem v-if="specs.engine?.fuelSystem" label="Fuel System" :value="specs.engine.fuelSystem" />
        <SpecItem v-if="specs.performance?.acceleration0To100Sec" label="0-100 km/h" :value="`${specs.performance.acceleration0To100Sec}s`" highlight />
        <SpecItem v-if="specs.performance?.topSpeedKmh" label="Top Speed" :value="`${specs.performance.topSpeedKmh} km/h`" />
      </div>
    </div>

    <!-- Dimensions -->
    <div v-if="hasDimensionSpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
        Dimensions
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.dimensions?.lengthMm" label="Length" :value="`${specs.dimensions.lengthMm} mm`" />
        <SpecItem v-if="specs.dimensions?.widthMm" label="Width" :value="`${specs.dimensions.widthMm} mm`" />
        <SpecItem v-if="specs.dimensions?.heightMm" label="Height" :value="`${specs.dimensions.heightMm} mm`" />
        <SpecItem v-if="specs.dimensions?.wheelbaseMm" label="Wheelbase" :value="`${specs.dimensions.wheelbaseMm} mm`" />
        <SpecItem v-if="specs.dimensions?.groundClearanceMm" label="Ground Clearance" :value="`${specs.dimensions.groundClearanceMm} mm`" />
        <SpecItem v-if="specs.dimensions?.kerbWeightKg" label="Kerb Weight" :value="`${specs.dimensions.kerbWeightKg} kg`" />
        <SpecItem v-if="specs.dimensions?.grossVehicleMassKg" label="GVM" :value="`${specs.dimensions.grossVehicleMassKg} kg`" />
        <SpecItem v-if="specs.dimensions?.bootCapacityL" label="Boot Capacity" :value="`${specs.dimensions.bootCapacityL} L`" :secondary="specs.dimensions.bootCapacityMaxL ? `Max: ${specs.dimensions.bootCapacityMaxL} L` : undefined" />
        <SpecItem v-if="specs.dimensions?.fuelTankL" label="Fuel Tank" :value="`${specs.dimensions.fuelTankL} L`" />
        <SpecItem v-if="specs.dimensions?.turningCircleM" label="Turning Circle" :value="`${specs.dimensions.turningCircleM} m`" />
        <SpecItem v-if="specs.dimensions?.towingCapacityBrakedKg" label="Towing (Braked)" :value="`${specs.dimensions.towingCapacityBrakedKg} kg`" />
        <SpecItem v-if="specs.dimensions?.towingCapacityUnbrakedKg" label="Towing (Unbraked)" :value="`${specs.dimensions.towingCapacityUnbrakedKg} kg`" />
      </div>
    </div>

    <!-- Drivetrain -->
    <div v-if="hasDrivetrainSpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Drivetrain
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.drivetrain?.driveType || specs.performance?.driveType" label="Drive Type" :value="specs.drivetrain?.driveType || specs.performance?.driveType || ''" />
        <SpecItem v-if="specs.drivetrain?.transmission || specs.performance?.transmission" label="Transmission" :value="specs.drivetrain?.transmission || specs.performance?.transmission || ''" />
        <SpecItem v-if="specs.drivetrain?.gearCount || specs.performance?.gearCount" label="Gears" :value="String(specs.drivetrain?.gearCount || specs.performance?.gearCount)" />
        <SpecItem v-if="specs.drivetrain?.differentialType" label="Differential" :value="specs.drivetrain.differentialType" />
        <SpecItem v-if="specs.drivetrain?.allWheelDriveSystem" label="AWD System" :value="specs.drivetrain.allWheelDriveSystem" />
      </div>
    </div>

    <!-- Safety -->
    <div v-if="hasSafetySpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        Safety
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.safety?.airbags" label="Airbags" :value="String(specs.safety.airbags)" />
        <SpecItem v-if="specs.safety?.airbagTypes?.length" label="Airbag Types" :value="specs.safety.airbagTypes.join(', ')" />
        <SpecItem v-if="specs.safety?.abs !== undefined" label="ABS" :value="specs.safety.abs ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.safety?.esc !== undefined" label="ESC" :value="specs.safety.esc ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.safety?.tractionControl !== undefined" label="Traction Control" :value="specs.safety.tractionControl ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.safety?.isofixPoints" label="ISOFIX Points" :value="String(specs.safety.isofixPoints)" />
        <SpecItem v-if="specs.safety?.reverseCamera !== undefined" label="Reverse Camera" :value="specs.safety.reverseCamera ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.safety?.parkingSensors" label="Parking Sensors" :value="specs.safety.parkingSensors" />
        <SpecItem v-if="specs.safety?.blindSpotMonitor !== undefined" label="Blind Spot Monitor" :value="specs.safety.blindSpotMonitor ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.safety?.laneKeepAssist !== undefined" label="Lane Keep Assist" :value="specs.safety.laneKeepAssist ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.safety?.autonomousEmergencyBraking !== undefined" label="AEB" :value="specs.safety.autonomousEmergencyBraking ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.safety?.adaptiveCruiseControl !== undefined" label="Adaptive Cruise" :value="specs.safety.adaptiveCruiseControl ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.safety?.rearCrossTrafficAlert !== undefined" label="Rear Cross Traffic" :value="specs.safety.rearCrossTrafficAlert ? 'Yes' : 'No'" />
      </div>
    </div>

    <!-- Interior -->
    <div v-if="hasInteriorSpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Interior
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.interior?.seatingCapacity" label="Seating Capacity" :value="String(specs.interior.seatingCapacity)" />
        <SpecItem v-if="specs.interior?.seatMaterial" label="Seat Material" :value="specs.interior.seatMaterial" />
        <SpecItem v-if="specs.interior?.driverSeatAdjustment" label="Driver Seat" :value="specs.interior.driverSeatAdjustment" />
        <SpecItem v-if="specs.interior?.heatedSeats" label="Heated Seats" :value="specs.interior.heatedSeats" />
        <SpecItem v-if="specs.interior?.ventilatedSeats" label="Ventilated Seats" :value="specs.interior.ventilatedSeats" />
        <SpecItem v-if="specs.interior?.climateControl" label="Climate Control" :value="specs.interior.climateControl" />
        <SpecItem v-if="specs.interior?.infotainmentScreen" label="Infotainment" :value="specs.interior.infotainmentScreen" />
        <SpecItem v-if="specs.interior?.digitalInstrumentCluster !== undefined" label="Digital Cluster" :value="specs.interior.digitalInstrumentCluster ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.interior?.headUpDisplay !== undefined" label="Head-Up Display" :value="specs.interior.headUpDisplay ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.interior?.sunroof" label="Sunroof" :value="specs.interior.sunroof" />
        <SpecItem v-if="specs.interior?.wirelessCharging !== undefined" label="Wireless Charging" :value="specs.interior.wirelessCharging ? 'Yes' : 'No'" />
      </div>
    </div>

    <!-- Suspension -->
    <div v-if="hasSuspensionSpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        Suspension
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.suspension?.front" label="Front" :value="specs.suspension.front" />
        <SpecItem v-if="specs.suspension?.rear" label="Rear" :value="specs.suspension.rear" />
        <SpecItem v-if="specs.suspension?.adaptiveDampers !== undefined" label="Adaptive Dampers" :value="specs.suspension.adaptiveDampers ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.suspension?.airSuspension !== undefined" label="Air Suspension" :value="specs.suspension.airSuspension ? 'Yes' : 'No'" />
      </div>
    </div>

    <!-- Brakes -->
    <div v-if="hasBrakeSpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        Brakes
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.brakes?.front" label="Front Brakes" :value="specs.brakes.front" :secondary="specs.brakes.frontDiameterMm ? `${specs.brakes.frontDiameterMm}mm` : undefined" />
        <SpecItem v-if="specs.brakes?.rear" label="Rear Brakes" :value="specs.brakes.rear" :secondary="specs.brakes.rearDiameterMm ? `${specs.brakes.rearDiameterMm}mm` : undefined" />
        <SpecItem v-if="specs.brakes?.electronicBrakeDistribution !== undefined" label="EBD" :value="specs.brakes.electronicBrakeDistribution ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.brakes?.brakeAssist !== undefined" label="Brake Assist" :value="specs.brakes.brakeAssist ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.brakes?.hillHoldAssist !== undefined" label="Hill Hold Assist" :value="specs.brakes.hillHoldAssist ? 'Yes' : 'No'" />
      </div>
    </div>

    <!-- Wheels -->
    <div v-if="hasWheelSpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Wheels
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.wheels?.wheelSize" label="Wheel Size" :value="specs.wheels.wheelSize" />
        <SpecItem v-if="specs.wheels?.tyreSize" label="Tyre Size" :value="specs.wheels.tyreSize" />
        <SpecItem v-if="specs.wheels?.spareWheel" label="Spare Wheel" :value="specs.wheels.spareWheel" />
        <SpecItem v-if="specs.wheels?.tyrePressureMonitoring !== undefined" label="TPMS" :value="specs.wheels.tyrePressureMonitoring ? 'Yes' : 'No'" />
      </div>
    </div>

    <!-- Exterior -->
    <div v-if="hasExteriorSpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Exterior
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.exterior?.headlights" label="Headlights" :value="specs.exterior.headlights" />
        <SpecItem v-if="specs.exterior?.daylightRunningLights" label="DRL" :value="specs.exterior.daylightRunningLights" />
        <SpecItem v-if="specs.exterior?.fogLights !== undefined" label="Fog Lights" :value="specs.exterior.fogLights ? 'Yes' : 'No'" />
        <SpecItem v-if="specs.exterior?.tailLights" label="Tail Lights" :value="specs.exterior.tailLights" />
        <SpecItem v-if="specs.exterior?.mirrors" label="Mirrors" :value="specs.exterior.mirrors" />
        <SpecItem v-if="specs.exterior?.roofRails !== undefined" label="Roof Rails" :value="specs.exterior.roofRails ? 'Yes' : 'No'" />
      </div>
    </div>

    <!-- Fuel Efficiency -->
    <div v-if="hasEfficiencySpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
        Fuel Efficiency
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.efficiency?.fuelConsumptionCombined" label="Combined" :value="`${specs.efficiency.fuelConsumptionCombined} L/100km`" highlight />
        <SpecItem v-if="specs.efficiency?.fuelConsumptionUrban" label="Urban" :value="`${specs.efficiency.fuelConsumptionUrban} L/100km`" />
        <SpecItem v-if="specs.efficiency?.fuelConsumptionExtraUrban" label="Extra Urban" :value="`${specs.efficiency.fuelConsumptionExtraUrban} L/100km`" />
        <SpecItem v-if="specs.efficiency?.co2EmissionsGkm" label="CO2 Emissions" :value="`${specs.efficiency.co2EmissionsGkm} g/km`" />
        <SpecItem v-if="specs.efficiency?.fuelType" label="Fuel Type" :value="specs.efficiency.fuelType" />
        <SpecItem v-if="specs.efficiency?.emissionStandard" label="Emission Standard" :value="specs.efficiency.emissionStandard" />
      </div>
    </div>

    <!-- Warranty -->
    <div v-if="hasWarrantySpecs" class="mb-6">
      <h3 class="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <svg class="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Warranty
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SpecItem v-if="specs.warranty?.vehicleWarrantyYears" label="Vehicle Warranty" :value="`${specs.warranty.vehicleWarrantyYears} years`" :secondary="specs.warranty.vehicleWarrantyKm ? `${(specs.warranty.vehicleWarrantyKm / 1000).toFixed(0)}k km` : undefined" highlight />
        <SpecItem v-if="specs.warranty?.drivetrainWarrantyYears" label="Drivetrain Warranty" :value="`${specs.warranty.drivetrainWarrantyYears} years`" :secondary="specs.warranty.drivetrainWarrantyKm ? `${(specs.warranty.drivetrainWarrantyKm / 1000).toFixed(0)}k km` : undefined" />
        <SpecItem v-if="specs.warranty?.roadSideAssistYears" label="Roadside Assist" :value="`${specs.warranty.roadSideAssistYears} years`" />
        <SpecItem v-if="specs.warranty?.rustWarrantyYears" label="Rust Warranty" :value="`${specs.warranty.rustWarrantyYears} years`" />
        <SpecItem v-if="specs.warranty?.batteryWarrantyYears" label="Battery Warranty" :value="`${specs.warranty.batteryWarrantyYears} years`" :secondary="specs.warranty.batteryWarrantyKm ? `${(specs.warranty.batteryWarrantyKm / 1000).toFixed(0)}k km` : undefined" />
      </div>
    </div>

    <!-- Important Disclaimer -->
    <div class="mt-6 pt-4 border-t border-slate-200">
      <h4 class="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
        <svg class="h-3.5 w-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        Important Disclaimer
      </h4>
      <p class="text-[11px] text-slate-500 leading-relaxed">
        These specifications are provided as a guide only and may not reflect the exact configuration of this specific vehicle. Vehicle specifications, features, and equipment can vary by model year, trim level, and market. We strongly recommend confirming all specifications, features, and availability with our dealership before making any purchasing decisions. Contact our sales team for the most accurate and up-to-date information about this vehicle.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue';
import type { VehicleSpecifications } from '~/composables/useVehicleEnrichment';

interface Props {
  specs: VehicleSpecifications;
  series?: string;
  generation?: string;
  confidence?: 'high' | 'medium' | 'low';
}

const props = defineProps<Props>();

const hasSpecs = computed(() => {
  return props.specs && (
    hasEngineSpecs.value ||
    hasDimensionSpecs.value ||
    hasDrivetrainSpecs.value ||
    hasSafetySpecs.value ||
    hasInteriorSpecs.value ||
    hasSuspensionSpecs.value ||
    hasBrakeSpecs.value ||
    hasWheelSpecs.value ||
    hasExteriorSpecs.value ||
    hasEfficiencySpecs.value ||
    hasWarrantySpecs.value
  );
});

const hasEngineSpecs = computed(() => {
  const e = props.specs?.engine;
  const p = props.specs?.performance;
  return (e && (e.type || e.powerKw || e.torqueNm || e.cylinders)) ||
         (p && (p.acceleration0To100Sec || p.topSpeedKmh));
});

const hasDimensionSpecs = computed(() => {
  const d = props.specs?.dimensions;
  return d && (d.lengthMm || d.widthMm || d.kerbWeightKg || d.bootCapacityL);
});

const hasDrivetrainSpecs = computed(() => {
  const dt = props.specs?.drivetrain;
  const p = props.specs?.performance;
  return (dt && (dt.driveType || dt.transmission || dt.gearCount)) ||
         (p && (p.driveType || p.transmission || p.gearCount));
});

const hasSafetySpecs = computed(() => {
  const s = props.specs?.safety;
  return s && (s.airbags || s.abs !== undefined || s.esc !== undefined || s.reverseCamera !== undefined);
});

const hasInteriorSpecs = computed(() => {
  const i = props.specs?.interior;
  return i && (i.seatingCapacity || i.seatMaterial || i.climateControl || i.infotainmentScreen);
});

const hasSuspensionSpecs = computed(() => {
  const s = props.specs?.suspension;
  return s && (s.front || s.rear);
});

const hasBrakeSpecs = computed(() => {
  const b = props.specs?.brakes;
  return b && (b.front || b.rear);
});

const hasWheelSpecs = computed(() => {
  const w = props.specs?.wheels;
  return w && (w.wheelSize || w.tyreSize);
});

const hasExteriorSpecs = computed(() => {
  const e = props.specs?.exterior;
  return e && (e.headlights || e.mirrors);
});

const hasEfficiencySpecs = computed(() => {
  const e = props.specs?.efficiency;
  return e && (e.fuelConsumptionCombined || e.co2EmissionsGkm);
});

const hasWarrantySpecs = computed(() => {
  const w = props.specs?.warranty;
  return w && (w.vehicleWarrantyYears || w.roadSideAssistYears);
});

const confidenceColor = computed(() => {
  switch (props.confidence) {
    case 'high': return 'bg-green-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-red-500';
    default: return 'bg-slate-400';
  }
});
</script>

<script lang="ts">
// Inline SpecItem component
const SpecItem = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
    secondary: { type: String, default: undefined },
    highlight: { type: Boolean, default: false },
  },
  setup(props) {
    return () => h('div', {
      class: [
        'rounded-lg border px-3 py-2',
        props.highlight
          ? 'border-primary/20 bg-primary/5'
          : 'border-slate-100 bg-slate-50',
      ],
    }, [
      h('div', { class: 'text-[11px] uppercase tracking-wide text-slate-500' }, props.label),
      h('div', {
        class: [
          'text-sm font-semibold',
          props.highlight ? 'text-primary' : 'text-slate-900',
        ],
      }, props.value),
      props.secondary && h('div', { class: 'text-xs text-slate-400' }, props.secondary),
    ]);
  },
});
</script>
