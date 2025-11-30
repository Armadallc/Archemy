import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "../../components/ui/form";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { CustomSelector } from "../../components/ui/custom-selector";

interface ClientFormProps {
  createForm: any;
  programs: any[];
  locations: any[];
  selectedProgram: string | null;
}

export const ComprehensiveClientForm: React.FC<ClientFormProps> = ({
  createForm,
  programs,
  locations,
  selectedProgram
}) => {
  return (
    <div className="space-y-6 bg-white">
      
      {/* 1. Avatar Section */}
      <div className="border-t pt-4 bg-white">
        <h4 className="text-sm font-medium text-gray-900 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Client Photo</h4>
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">Photo</span>
          </div>
          <div>
            <Button type="button" variant="outline" size="sm">
              Upload Photo
            </Button>
            <p className="text-xs text-gray-500 mt-1">Optional client photo</p>
          </div>
        </div>
      </div>

      {/* 2. Personal Information Section */}
      <div className="border-t pt-4 bg-white">
        <h4 className="text-sm font-medium text-gray-900 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Personal Information</h4>
        
        {/* Contact Subsection */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Contact</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={createForm.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>First Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Last Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField
              control={createForm.control}
              name="phone_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Phone Type</FormLabel>
                  <FormControl>
                    <CustomSelector
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select type"
                      options={[
                        { value: "Mobile", label: "Mobile" },
                        { value: "Home", label: "Home" }
                      ]}
                      className="mt-1"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="client@email.com" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={createForm.control}
            name="address"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="123 Main Street, City, State 12345" className="mt-1" {...field} />
                </FormControl>
                <div className="flex items-center space-x-2 mt-2">
                  <FormField
                    control={createForm.control}
                    name="use_location_address"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm text-gray-600">
                          Use location address
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Demographics Subsection */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Demographics</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={createForm.control}
              name="birth_sex"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Birth Sex</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex items-center gap-6 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Male" id="male" />
                        <label htmlFor="male" className="text-sm font-medium cursor-pointer">Male</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Female" id="female" />
                        <label htmlFor="female" className="text-sm font-medium cursor-pointer">Female</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter age" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={createForm.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Date of Birth</FormLabel>
                  <FormControl>
                    <Input type="date" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={createForm.control}
              name="race"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Race</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter race" className="mt-1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* 3. Program & Location Section */}
      <div className="border-t pt-4 bg-white">
        <h4 className="text-sm font-medium text-gray-900 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Program & Location</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={createForm.control}
            name="program_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Program *</FormLabel>
                <FormControl>
                  <CustomSelector
                    value={field.value || selectedProgram || ''}
                    onValueChange={field.onChange}
                    placeholder="Select program"
                    options={programs.map(program => ({
                      value: program.id,
                      label: program.name
                    }))}
                    className="mt-1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={createForm.control}
            name="location_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Location</FormLabel>
                <FormControl>
                  <CustomSelector
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select location"
                    options={locations.map(location => ({
                      value: location.id,
                      label: location.name
                    }))}
                    className="mt-1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* 4. Program Contacts Section */}
      <div className="border-t pt-4 bg-white">
        <h4 className="text-sm font-medium text-gray-900 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Program Contacts</h4>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Add program contacts (Case Manager, Peer, etc.) who can be reached during trips.
          </div>
          <Button type="button" variant="outline" size="sm">
            + Add Contact
          </Button>
          {/* Contact list will be dynamically rendered here */}
        </div>
      </div>

      {/* 5. Transport Requirements Section */}
      <div className="border-t pt-4 bg-white">
        <h4 className="text-sm font-medium text-gray-900 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Transport Requirements</h4>
        
        {/* Mobility Requirements */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Mobility</h5>
          <div className="space-y-2">
            {['Ambulatory', 'Wheelchair', 'Walker/Cane', 'Bariatric', 'Limited Mobility/Needs Assistance', 'Other'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox id={`mobility-${option}`} />
                <label htmlFor={`mobility-${option}`} className="text-sm">{option}</label>
                {option === 'Other' && (
                  <Input placeholder="Specify other mobility need" className="ml-4 w-64" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Special Requirements */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Special</h5>
          <div className="space-y-2">
            {['Door to Door', 'Curb to Curb', 'Soft Landing (driver escorts client to/from)', 'Driver needs to: Pick up paperwork', 'Driver needs to: Drop off paperwork', 'Other'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox id={`special-${option}`} />
                <label htmlFor={`special-${option}`} className="text-sm">{option}</label>
                {option === 'Other' && (
                  <Input placeholder="Specify other special need" className="ml-4 w-64" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Communication Needs */}
        <div className="mb-6">
          <h5 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Communication Needs</h5>
          <div className="space-y-2">
            {['Non-Verbal', 'Calm Communication', 'Calm Music', 'Other'].map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox id={`communication-${option}`} />
                <label htmlFor={`communication-${option}`} className="text-sm">{option}</label>
                {option === 'Other' && (
                  <Input placeholder="Specify other communication need" className="ml-4 w-64" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Safety/Comfort */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Safety/Comfort</h5>
          <FormField
            control={createForm.control}
            name="preferred_driver_request"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium" style={{ fontFamily: 'Nohemi', fontWeight: 500 }}>Driver Request (familiar face)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any specific driver preferences or requests" className="mt-1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
