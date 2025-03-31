
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schemaTypes = [
  { value: "article", label: "Article / BlogPost" },
  { value: "organization", label: "Organization" },
  { value: "localBusiness", label: "Local Business" },
  { value: "product", label: "Product" },
  { value: "faq", label: "FAQPage" },
  { value: "event", label: "Event" },
  { value: "person", label: "Person" },
  { value: "recipe", label: "Recipe" },
  { value: "breadcrumb", label: "Breadcrumb" },
  { value: "jobPosting", label: "JobPosting" },
];

export default function SchemaGenerator() {
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getSchemaMarkup = () => {
    let schema: any = {
      "@context": "https://schema.org",
      "@type": selectedType.charAt(0).toUpperCase() + selectedType.slice(1),
    };

    Object.entries(formData).forEach(([key, value]) => {
      if (value) {
        schema[key] = value;
      }
    });

    return JSON.stringify(schema, null, 2);
  };

  const renderFields = () => {
    switch (selectedType) {
      case "article":
        return (
          <>
            <Label>Title</Label>
            <Input onChange={(e) => handleInputChange("headline", e.target.value)} />
            <Label>Author Name</Label>
            <Input onChange={(e) => handleInputChange("author", e.target.value)} />
            <Label>Publication Date</Label>
            <Input type="date" onChange={(e) => handleInputChange("datePublished", e.target.value)} />
            <Label>Article Body</Label>
            <Textarea onChange={(e) => handleInputChange("articleBody", e.target.value)} />
            <Label>Featured Image URL</Label>
            <Input onChange={(e) => handleInputChange("image", e.target.value)} />
          </>
        );
      case "organization":
        return (
          <>
            <Label>Organization Name</Label>
            <Input onChange={(e) => handleInputChange("name", e.target.value)} />
            <Label>Website URL</Label>
            <Input onChange={(e) => handleInputChange("url", e.target.value)} />
            <Label>Logo URL</Label>
            <Input onChange={(e) => handleInputChange("logo", e.target.value)} />
            <Label>Contact Email</Label>
            <Input onChange={(e) => handleInputChange("email", e.target.value)} />
            <Label>Phone Number</Label>
            <Input onChange={(e) => handleInputChange("telephone", e.target.value)} />
          </>
        );
      case "localBusiness":
        return (
          <>
            <Label>Business Name</Label>
            <Input onChange={(e) => handleInputChange("name", e.target.value)} />
            <Label>Business Type</Label>
            <Input onChange={(e) => handleInputChange("type", e.target.value)} />
            <Label>Address</Label>
            <Input onChange={(e) => handleInputChange("address", e.target.value)} />
            <Label>Phone Number</Label>
            <Input onChange={(e) => handleInputChange("telephone", e.target.value)} />
            <Label>Opening Hours</Label>
            <Input onChange={(e) => handleInputChange("openingHours", e.target.value)} />
          </>
        );
      case "product":
        return (
          <>
            <Label>Product Name</Label>
            <Input onChange={(e) => handleInputChange("name", e.target.value)} />
            <Label>Brand Name</Label>
            <Input onChange={(e) => handleInputChange("brand", e.target.value)} />
            <Label>Description</Label>
            <Textarea onChange={(e) => handleInputChange("description", e.target.value)} />
            <Label>Price</Label>
            <Input type="number" onChange={(e) => handleInputChange("price", e.target.value)} />
            <Label>Currency</Label>
            <Input onChange={(e) => handleInputChange("priceCurrency", e.target.value)} />
          </>
        );
      case "faq":
        return (
          <>
            <Label>Question</Label>
            <Input onChange={(e) => handleInputChange("question", e.target.value)} />
            <Label>Answer</Label>
            <Textarea onChange={(e) => handleInputChange("answer", e.target.value)} />
          </>
        );
      case "event":
        return (
          <>
            <Label>Event Name</Label>
            <Input onChange={(e) => handleInputChange("name", e.target.value)} />
            <Label>Description</Label>
            <Textarea onChange={(e) => handleInputChange("description", e.target.value)} />
            <Label>Start Date</Label>
            <Input type="datetime-local" onChange={(e) => handleInputChange("startDate", e.target.value)} />
            <Label>End Date</Label>
            <Input type="datetime-local" onChange={(e) => handleInputChange("endDate", e.target.value)} />
            <Label>Location</Label>
            <Input onChange={(e) => handleInputChange("location", e.target.value)} />
          </>
        );
      case "person":
        return (
          <>
            <Label>Full Name</Label>
            <Input onChange={(e) => handleInputChange("name", e.target.value)} />
            <Label>Job Title</Label>
            <Input onChange={(e) => handleInputChange("jobTitle", e.target.value)} />
            <Label>Company</Label>
            <Input onChange={(e) => handleInputChange("worksFor", e.target.value)} />
            <Label>Website</Label>
            <Input onChange={(e) => handleInputChange("url", e.target.value)} />
          </>
        );
      case "recipe":
        return (
          <>
            <Label>Recipe Name</Label>
            <Input onChange={(e) => handleInputChange("name", e.target.value)} />
            <Label>Description</Label>
            <Textarea onChange={(e) => handleInputChange("description", e.target.value)} />
            <Label>Preparation Time (minutes)</Label>
            <Input type="number" onChange={(e) => handleInputChange("prepTime", e.target.value)} />
            <Label>Cooking Time (minutes)</Label>
            <Input type="number" onChange={(e) => handleInputChange("cookTime", e.target.value)} />
            <Label>Ingredients</Label>
            <Textarea onChange={(e) => handleInputChange("recipeIngredient", e.target.value)} />
            <Label>Instructions</Label>
            <Textarea onChange={(e) => handleInputChange("recipeInstructions", e.target.value)} />
          </>
        );
      case "breadcrumb":
        return (
          <>
            <Label>Homepage URL</Label>
            <Input onChange={(e) => handleInputChange("homeUrl", e.target.value)} />
            <Label>Homepage Name</Label>
            <Input onChange={(e) => handleInputChange("homeName", e.target.value)} />
            <Label>Current Page URL</Label>
            <Input onChange={(e) => handleInputChange("currentUrl", e.target.value)} />
            <Label>Current Page Name</Label>
            <Input onChange={(e) => handleInputChange("currentName", e.target.value)} />
          </>
        );
      case "jobPosting":
        return (
          <>
            <Label>Job Title</Label>
            <Input onChange={(e) => handleInputChange("title", e.target.value)} />
            <Label>Company Name</Label>
            <Input onChange={(e) => handleInputChange("hiringOrganization", e.target.value)} />
            <Label>Location</Label>
            <Input onChange={(e) => handleInputChange("jobLocation", e.target.value)} />
            <Label>Description</Label>
            <Textarea onChange={(e) => handleInputChange("description", e.target.value)} />
            <Label>Employment Type</Label>
            <Input onChange={(e) => handleInputChange("employmentType", e.target.value)} />
            <Label>Salary Range</Label>
            <Input onChange={(e) => handleInputChange("baseSalary", e.target.value)} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Schema Markup Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <Select onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Schema Type" />
                </SelectTrigger>
                <SelectContent>
                  {schemaTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedType && (
                <div className="space-y-4">
                  {renderFields()}
                </div>
              )}
            </div>

            <div>
              <Label>Preview</Label>
              <pre className="p-4 bg-slate-100 rounded-lg overflow-auto max-h-[600px]">
                {selectedType ? getSchemaMarkup() : "Select a schema type to preview"}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
