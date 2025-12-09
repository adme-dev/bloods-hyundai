import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'vue';
import 'consola';

const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "";
const roundToTen = (num) => Math.round(num / 10) * 10;
function calculateWeeklyPayment(price, annualInterestRate = 9.8, loanTermYears = 5) {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const loanTermMonths = loanTermYears * 12;
  const i = Math.pow(1 + monthlyInterestRate, loanTermMonths);
  const payment = i !== 1 ? price * monthlyInterestRate * i / (i - 1) : 0;
  return payment * 12 / 52;
}
function createFiltersFromVehicles(vehicles) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t;
  const filterData = {
    conditions: /* @__PURE__ */ new Map(),
    models: /* @__PURE__ */ new Map(),
    badges: /* @__PURE__ */ new Set(),
    colours: /* @__PURE__ */ new Map(),
    bodyTypes: /* @__PURE__ */ new Map(),
    transmissions: /* @__PURE__ */ new Map(),
    drivetrains: /* @__PURE__ */ new Map(),
    fuels: /* @__PURE__ */ new Map(),
    seats: /* @__PURE__ */ new Map(),
    doors: /* @__PURE__ */ new Map(),
    priceRange: { min: Number.MAX_SAFE_INTEGER, max: 0 },
    kmsRange: { min: Number.MAX_SAFE_INTEGER, max: 0 }
  };
  for (const vehicle of vehicles) {
    filterData.priceRange.max = Math.max(filterData.priceRange.max, vehicle.price || 0);
    filterData.priceRange.min = Math.min(filterData.priceRange.min, vehicle.price || 0);
    filterData.kmsRange.max = Math.max(filterData.kmsRange.max, vehicle.kms || 0);
    filterData.kmsRange.min = Math.min(filterData.kmsRange.min, vehicle.kms || 0);
    (_b = (_a = vehicle.condition) == null ? void 0 : _a.value) == null ? void 0 : _b.forEach((val) => filterData.conditions.set(val, true));
    (_d = (_c = vehicle.body) == null ? void 0 : _c.value) == null ? void 0 : _d.forEach((val) => filterData.bodyTypes.set(val, true));
    (_f = (_e = vehicle.transmission) == null ? void 0 : _e.value) == null ? void 0 : _f.forEach((val) => filterData.transmissions.set(val, true));
    (_h = (_g = vehicle.drivetrain) == null ? void 0 : _g.value) == null ? void 0 : _h.forEach((val) => filterData.drivetrains.set(val, true));
    (_j = (_i = vehicle.fuel) == null ? void 0 : _i.value) == null ? void 0 : _j.forEach((val) => filterData.fuels.set(val, true));
    (_l = (_k = vehicle.seats) == null ? void 0 : _k.value) == null ? void 0 : _l.forEach((val) => filterData.seats.set(val, true));
    (_n = (_m = vehicle.doors) == null ? void 0 : _m.value) == null ? void 0 : _n.forEach((val) => filterData.doors.set(val, true));
    (_p = (_o = vehicle.colour) == null ? void 0 : _o.value) == null ? void 0 : _p.forEach((colour) => filterData.colours.set(capitalize(colour), true));
    (_r = (_q = vehicle.badge) == null ? void 0 : _q.value) == null ? void 0 : _r.forEach((val) => filterData.badges.add(val));
    (_t = (_s = vehicle.model) == null ? void 0 : _s.value) == null ? void 0 : _t.forEach((value, index) => {
      var _a2, _b2, _c2, _d2, _e2;
      const modelKey = JSON.stringify({
        value,
        displayValue: (_a2 = vehicle.model.displayValue) == null ? void 0 : _a2[index],
        displayMake: (_d2 = (_c2 = (_b2 = vehicle.model.displayMake) == null ? void 0 : _b2[index]) == null ? void 0 : _c2.displayValue) == null ? void 0 : _d2[0],
        displayBody: (_e2 = vehicle.model.displayBody) == null ? void 0 : _e2[index]
      });
      filterData.models.set(modelKey, true);
    });
  }
  const minWeeklyPayment = calculateWeeklyPayment(filterData.priceRange.min);
  const maxWeeklyPayment = calculateWeeklyPayment(filterData.priceRange.max);
  return [
    { name: "condition", displayName: "Condition", type: "checkbox", data: Array.from(filterData.conditions.keys()).map((value) => ({ value, displayValue: capitalize(value) })) },
    { name: "model", displayName: "Models", type: "multiselect", data: Array.from(filterData.models.keys()).map((json) => JSON.parse(json)) },
    { name: "badge", displayName: "Badges", type: "checkbox", data: Array.from(filterData.badges).sort().map((value) => ({ value: value || "", displayValue: value ? capitalize(value) : "Select a badge" })) },
    { name: "colour", displayName: "Colour", type: "checkbox", data: Array.from(filterData.colours.keys()).map((colour) => ({ value: colour.toLowerCase(), displayValue: colour })) },
    { name: "price", displayName: "Budget", type: "slider", data: { max: filterData.priceRange.max, min: filterData.priceRange.min, step: 500 } },
    { name: "perweek", displayName: "Per week budget", type: "slider", data: { min: roundToTen(minWeeklyPayment), max: roundToTen(maxWeeklyPayment), step: 10 } },
    { name: "kms", displayName: "Kilometres", type: "slider", data: { max: filterData.kmsRange.max, min: filterData.kmsRange.min, step: 1e3 } },
    { name: "body", displayName: "Body", type: "checkbox", data: Array.from(filterData.bodyTypes.keys()).map((value) => ({ value, displayValue: capitalize(value) })) },
    { name: "transmission", displayName: "Transmission", type: "checkbox", data: Array.from(filterData.transmissions.keys()).map((value) => ({ value: value || "", displayValue: value ? capitalize(value) : "Undefined" })) },
    { name: "drivetrain", displayName: "Drive Train", type: "checkbox", data: Array.from(filterData.drivetrains.keys()).map((value) => ({ value: value || "", displayValue: value || "Undefined" })) },
    { name: "fuel", displayName: "Fuel Type", type: "checkbox", data: Array.from(filterData.fuels.keys()).map((value) => ({ value: value || "", displayValue: value || "Undefined" })) },
    { name: "seats", displayName: "Seating Capacity", type: "checkbox", data: Array.from(filterData.seats.keys()).map((value) => ({ value: value || "", displayValue: value || "Undefined" })) }
  ];
}
const carsalesFeed = defineEventHandler(async (event) => {
  const urls = [
    "https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/sale-motor-group/data.json",
    "https://tsheefvkecaervnrxvdf.supabase.co/storage/v1/object/public/bucket/sale-motor-group-new-cars/data.json"
  ];
  try {
    const responses = await Promise.all(
      urls.map((url) => $fetch(url, { timeout: 1e4 }))
    );
    const uniqueIds = /* @__PURE__ */ new Set();
    const vehicles = [];
    responses.forEach((data) => {
      var _a, _b, _c;
      if (!Array.isArray(data)) return;
      for (const vehicle of data) {
        if (uniqueIds.has(vehicle.id)) continue;
        const isHyundai = (_b = (_a = vehicle.model) == null ? void 0 : _a.displayMake) == null ? void 0 : _b.some(
          (makes) => {
            var _a2;
            return (_a2 = makes == null ? void 0 : makes.displayValue) == null ? void 0 : _a2.some(
              (make) => make == null ? void 0 : make.toLowerCase().includes("hyundai")
            );
          }
        );
        const conditionValues = ((_c = vehicle.condition) == null ? void 0 : _c.value) || [];
        const isDemo = conditionValues.some((value) => value.toLowerCase().includes("demo"));
        const isNew = conditionValues.some((value) => value.toLowerCase().includes("new"));
        const isUsed = conditionValues.some((value) => value.toLowerCase().includes("used"));
        let shouldIncludeVehicle = false;
        if (isHyundai) {
          shouldIncludeVehicle = isDemo || isNew;
        } else {
          shouldIncludeVehicle = isUsed;
        }
        if (shouldIncludeVehicle) {
          uniqueIds.add(vehicle.id);
          vehicle.perweek = Math.round(calculateWeeklyPayment(vehicle.price || 0));
          vehicles.push(vehicle);
        }
      }
    });
    const startIndex = Math.max(vehicles.length - 15, 0);
    for (let i = startIndex; i < vehicles.length; i++) {
      vehicles[i].stock_special = {
        value: ["stock-special"],
        displayValue: ["STOCK SPECIAL"]
      };
    }
    const filters = createFiltersFromVehicles(vehicles);
    return {
      vehiclesData: vehicles,
      filters
    };
  } catch (error) {
    console.error("Error fetching carsales feed:", error);
    return {
      vehiclesData: [],
      filters: []
    };
  }
});

export { carsalesFeed as default };
//# sourceMappingURL=carsales-feed.mjs.map
