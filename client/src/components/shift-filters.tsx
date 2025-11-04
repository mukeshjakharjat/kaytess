import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Facility } from "@shared/schema";

interface ShiftFiltersProps {
  onFilterChange: (filters: any) => void;
}

export default function ShiftFilters({ onFilterChange }: ShiftFiltersProps) {
  const [filters, setFilters] = useState({
    facilityId: "",
    departmentId: "",
    date: "",
    payRange: "",
    priority: "",
  });

  const { data: facilities = [] } = useQuery<Facility[]>({
    queryKey: ["/api/facilities"],
    retry: false,
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Convert to API format
    const apiFilters: any = {};
    if (newFilters.facilityId) apiFilters.facilityId = parseInt(newFilters.facilityId);
    if (newFilters.departmentId) apiFilters.departmentId = newFilters.departmentId;
    if (newFilters.date) apiFilters.date = newFilters.date;
    if (newFilters.priority) apiFilters.priority = newFilters.priority;
    
    // Handle pay range
    if (newFilters.payRange) {
      switch (newFilters.payRange) {
        case "30-40":
          apiFilters.minRate = 30;
          apiFilters.maxRate = 40;
          break;
        case "40-50":
          apiFilters.minRate = 40;
          apiFilters.maxRate = 50;
          break;
        case "50+":
          apiFilters.minRate = 50;
          break;
      }
    }
    
    onFilterChange(apiFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      facilityId: "",
      departmentId: "",
      date: "",
      payRange: "",
      priority: "",
    };
    setFilters(emptyFilters);
    onFilterChange({});
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="facility">Facility</Label>
            <Select
              value={filters.facilityId}
              onValueChange={(value) => handleFilterChange("facilityId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Facilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities</SelectItem>
                {facilities?.filter((facility: Facility) => facility.id && facility.name).map((facility: Facility) => (
                  <SelectItem key={facility.id} value={facility.id.toString()}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={filters.departmentId}
              onValueChange={(value) => handleFilterChange("departmentId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="ICU - Intensive Care Unit">ICU - Intensive Care Unit</SelectItem>
                <SelectItem value="Emergency Department">Emergency Department</SelectItem>
                <SelectItem value="General Medicine">General Medicine</SelectItem>
                <SelectItem value="Surgery">Surgery</SelectItem>
                <SelectItem value="Pediatrics">Pediatrics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date From</Label>
            <Input
              id="date"
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payRange">Pay Rate</Label>
            <Select
              value={filters.payRange}
              onValueChange={(value) => handleFilterChange("payRange", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Rates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Rates</SelectItem>
                <SelectItem value="30-40">$30-40/hr</SelectItem>
                <SelectItem value="40-50">$40-50/hr</SelectItem>
                <SelectItem value="50+">$50+/hr</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={filters.priority}
              onValueChange={(value) => handleFilterChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={clearFilters} size="sm">
            Clear Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
