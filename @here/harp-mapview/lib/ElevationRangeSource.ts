/*
 * Copyright (C) 2017-2020 HERE Europe B.V.
 * Licensed under Apache 2.0, see full license in LICENSE
 * SPDX-License-Identifier: Apache-2.0
 */
import { TilingScheme } from "@here/harp-geoutils";
import { TileKey } from "@here/harp-geoutils/lib/tiling/TileKey";

import { DataSource } from "./DataSource";

/**
 * Status of the elevation range calculation.
 */
export enum CalculationStatus {
    // Calculated approximately. A more precise result may be available later.
    PendingApproximate,
    // Calculation completed. The result is final, won't improve upon retrying.
    FinalPrecise
}

/**
 * Elevation range with an optional calculation status.
 */
export interface ElevationRange {
    minElevation: number;
    maxElevation: number;
    calculationStatus?: CalculationStatus;
}

/**
 * Source for elevation ranges per tile. The returned elevation ranges will be used in the visible
 * tile computation to calculate proper bounding boxes.
 */
export interface ElevationRangeSource {
    /**
     * Compute the elevation range for a given {@link @here/harp-geoutils#TileKey}.
     * @param tileKey - The tile for which the elevation range should be computed.
     */
    getElevationRange(tileKey: TileKey): ElevationRange;

    /**
     * The tiling scheme of this {@link ElevationRangeSource}.
     *
     * @remarks
     * {@link MapView} will only apply the elevation
     * ranges returned by [[getElevationRange]] that have
     * the same {@link @here/harp-geoutils#TilingScheme}.
     */
    getTilingScheme(): TilingScheme;

    /**
     * Connects to the underlying data.
     */
    connect(): Promise<void>;

    /**
     * Returns `true` if this `ElevationRangeSource` is ready and the {@link MapView} can invoke
     * `getElevationRange()` to start requesting data.
     */
    ready(): boolean;
}

/**
 * An [[ElevationRangeSource]] that delivers static values for the [[ElevationRange]], which are
 * either setup from a [[DataSource]] or set in the constructor. Useful in situations where the
 * geometry of the data is not (only) at ground level, where it may be clipped in certain
 * situations.
 */
export class StaticElevationRangeSource implements ElevationRangeSource {
    readonly m_tilingScheme: TilingScheme;
    readonly m_minElevation: number = 0;
    readonly m_maxElevation: number = 0;

    /**
     * Initialize the `StaticElevationRangeSource` from either a [[DataSource]] or from the
     * options that are passed in.
     *
     * @param dataSource Either a [[DataSource]] to retrieve min/max elevation and [[TilingScheme]]
     * from, or a [[TilingScheme]].
     * @param minElevation If a [[TilingScheme]] set the minimum elevation of this
     * [[ElevationRangeSource]].
     * @param maxElevation If a [[TilingScheme]] set the maximum elevation of this
     * [[ElevationRangeSource]].
     */
    constructor(
        dataSource: DataSource | TilingScheme,
        minElevation: number = 0,
        maxElevation: number = 0
    ) {
        if (dataSource instanceof DataSource) {
            this.m_tilingScheme = dataSource.getTilingScheme();
            this.m_minElevation = dataSource.minGeometryHeight;
            this.m_maxElevation = dataSource.maxGeometryHeight;
        } else {
            this.m_tilingScheme = dataSource;
            this.m_minElevation = minElevation;
            this.m_maxElevation = maxElevation;
        }
    }

    /**
     * Compute the elevation range for a given {@link @here/harp-geoutils#TileKey}.
     * @param tileKey - The tile for which the elevation range should be computed.
     */
    getElevationRange(tileKey: TileKey): ElevationRange {
        return {
            minElevation: this.m_minElevation,
            maxElevation: this.m_maxElevation,
            calculationStatus: CalculationStatus.FinalPrecise
        };
    }

    /**
     * The tiling scheme of this {@link ElevationRangeSource}.
     *
     * @remarks
     * {@link MapView} will only apply the elevation
     * ranges returned by [[getElevationRange]] that have
     * the same {@link @here/harp-geoutils#TilingScheme}.
     */
    getTilingScheme(): TilingScheme {
        return this.m_tilingScheme;
    }

    /**
     * Connects to the underlying data.
     */
    connect(): Promise<void> {
        return Promise.resolve();
    }

    /**
     * Returns `true` if this [[ElevationRangeSource]] is ready and the {@link MapView} can invoke
     * `getElevationRange()` to start requesting data.
     */
    ready(): boolean {
        return true;
    }
}
