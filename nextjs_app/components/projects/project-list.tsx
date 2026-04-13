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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate, getInitials } from "@/lib/utils";
import type { ProjectWithRelations } from "@/types";

interface Props {
  projects: ProjectWithRelations[];
}

export function ProjectList({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">No projects found.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Manager</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>
                <Link
                  href={`/projects/${project.id}`}
                  className="font-medium hover:underline"
                >
                  {project.name}
                </Link>
                <p className="text-xs text-muted-foreground">#{project.number}</p>
              </TableCell>
              <TableCell>
                {project.current_stage ? (
                  <Badge variant="outline">{project.current_stage.name}</Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {project.user_manager ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.user_manager.avatar_url ?? ""} />
                      <AvatarFallback className="text-xs">
                        {getInitials(
                          project.user_manager.first_name,
                          project.user_manager.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {project.user_manager.first_name} {project.user_manager.last_name}
                    </span>
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>{formatDate(project.start_date)}</TableCell>
              <TableCell>{formatDate(project.end_date)}</TableCell>
              <TableCell>
                <Badge variant={project.is_active ? "default" : "secondary"}>
                  {project.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
