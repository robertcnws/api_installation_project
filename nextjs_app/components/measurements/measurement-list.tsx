"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import type { MeasurementWithRelations } from "@/types";

interface Props {
  measurements: MeasurementWithRelations[];
}

export function MeasurementList({ measurements }: Props) {
  if (measurements.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No measurements found.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Number</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>First Date</TableHead>
            <TableHead>Check Date</TableHead>
            <TableHead>Reporter</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {measurements.map((m) => (
            <TableRow key={m.id}>
              <TableCell>
                <Link
                  href={`/measurements/${m.id}`}
                  className="font-medium hover:underline"
                >
                  #{m.number}
                </Link>
              </TableCell>
              <TableCell>{m.address ?? "—"}</TableCell>
              <TableCell>{m.phone ?? "—"}</TableCell>
              <TableCell>{formatDate(m.first_date)}</TableCell>
              <TableCell>{formatDate(m.check_date)}</TableCell>
              <TableCell>
                {m.user_reporter
                  ? `${m.user_reporter.first_name} ${m.user_reporter.last_name}`
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
