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
import type { ServiceWithRelations } from "@/types";

interface Props {
  services: ServiceWithRelations[];
}

export function ServiceList({ services }: Props) {
  if (services.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No services found.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Closed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell>
                <Link
                  href={`/services/${service.id}`}
                  className="font-medium hover:underline"
                >
                  {service.name}
                </Link>
                <p className="text-xs text-muted-foreground">#{service.number}</p>
              </TableCell>
              <TableCell>
                {service.service_type ? (
                  <Badge variant="outline">{service.service_type}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {service.current_stage ? (
                  <Badge variant="outline">{service.current_stage.name}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{formatDate(service.start_date)}</TableCell>
              <TableCell>
                <Badge variant={service.paid ? "default" : "secondary"}>
                  {service.paid ? "Paid" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={service.is_closed ? "secondary" : "default"}>
                  {service.is_closed ? "Closed" : "Open"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
