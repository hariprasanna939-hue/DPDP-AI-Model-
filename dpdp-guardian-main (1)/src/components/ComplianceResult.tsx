import { AlertTriangle, CheckCircle, AlertCircle, FileText, TrendingUp, DollarSign, ChevronRight, Shield, Clock, Zap, ExternalLink, Download, Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Finding {
  summary: string;
  section: string;
  clauseDescription: string;
  complianceStatus: "Compliant" | "Non-Compliant" | "Partially Compliant";
  riskLevel: "Low" | "Medium" | "High";
  explanation: string;
  remediation: string[];
  references?: string[];
}

interface ComplianceResultProps {
  findings: Finding[];
  uploadedFiles: string[];
  overallRiskPercentage: number;
  financialDisclosure?: {
    potentialPenalty: string;
    exposureLevel: string;
    timeframe?: string;
  };
  analysisTime?: string;
  confidenceScore?: number;
}

export const ComplianceResult = ({
  findings,
  uploadedFiles,
  overallRiskPercentage,
  financialDisclosure,
  analysisTime = "2m",
  confidenceScore = 92,
}: ComplianceResultProps) => {
  const [expandedFindings, setExpandedFindings] = useState<number[]>([]);

  const toggleFinding = (index: number) => {
    setExpandedFindings(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const getStatusIcon = (status: Finding["complianceStatus"]) => {
    switch (status) {
      case "Compliant":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Non-Compliant":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "Partially Compliant":
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getRiskScore = (level: Finding["riskLevel"]) => {
    switch (level) {
      case "Low": return 25;
      case "Medium": return 50;
      case "High": return 85;
    }
  };

  const getStatusBadge = (status: Finding["complianceStatus"]) => {
    const styles = {
      Compliant: "bg-green-500/10 text-green-600",
      "Non-Compliant": "bg-red-500/10 text-red-600",
      "Partially Compliant": "bg-amber-500/10 text-amber-600",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getRiskBadge = (level: Finding["riskLevel"]) => {
    const styles = {
      Low: "bg-green-500/10 text-green-600",
      Medium: "bg-amber-500/10 text-amber-600",
      High: "bg-red-500/10 text-red-600",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1 ${styles[level]}`}>
        <div className={`h-1.5 w-1.5 rounded-full ${
          level === "Low" ? "bg-green-500" :
          level === "Medium" ? "bg-amber-500" : "bg-red-500"
        }`} />
        {level}
      </span>
    );
  };

  const getRiskColor = (percentage: number) => {
    if (percentage <= 30) return "bg-green-500";
    if (percentage <= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getRiskLabel = (percentage: number) => {
    if (percentage <= 30) return "Low";
    if (percentage <= 60) return "Medium";
    return "High";
  };

  // Statistics
  const compliantCount = findings.filter(f => f.complianceStatus === "Compliant").length;
  const nonCompliantCount = findings.filter(f => f.complianceStatus === "Non-Compliant").length;
  const highRiskCount = findings.filter(f => f.riskLevel === "High").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Compliance Report</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{analysisTime}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Risk Score */}
        <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary/10 rounded">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Risk Score</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground">{overallRiskPercentage}%</span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {getRiskLabel(overallRiskPercentage)}
            </span>
          </div>
          <Progress 
            value={overallRiskPercentage} 
            className="h-1 mt-2 bg-muted" 
          />
        </Card>

        {/* Findings */}
        <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-500/10 rounded">
              <Shield className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Findings</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{compliantCount}</div>
              <div className="text-xs text-muted-foreground">Compliant</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{nonCompliantCount}</div>
              <div className="text-xs text-muted-foreground">Non-compliant</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">{highRiskCount}</div>
              <div className="text-xs text-muted-foreground">High Risk</div>
            </div>
          </div>
        </Card>

        {/* Confidence */}
        <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-500/10 rounded">
              <Zap className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Confidence</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-foreground">{confidenceScore}%</span>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              High
            </Badge>
          </div>
        </Card>

        {/* Financial Exposure */}
        {financialDisclosure ? (
          <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-rose-500/10 rounded">
                <DollarSign className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Exposure</span>
            </div>
            <div className="space-y-1">
              <p className="text-lg font-bold text-foreground truncate">{financialDisclosure.potentialPenalty}</p>
              <p className="text-xs text-muted-foreground truncate">{financialDisclosure.exposureLevel}</p>
            </div>
          </Card>
        ) : (
          <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-muted rounded">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Files</span>
            </div>
            <div className="space-y-1">
              {uploadedFiles.slice(0, 2).map((file, idx) => (
                <p key={idx} className="text-xs font-medium text-foreground truncate">{file}</p>
              ))}
              {uploadedFiles.length > 2 && (
                <p className="text-xs text-muted-foreground">+{uploadedFiles.length - 2} more</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Findings Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Findings ({findings.length})</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sorted by risk</span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          {findings.map((finding, index) => (
            <Card 
              key={index} 
              className={`p-4 border transition-all hover:shadow-sm ${
                expandedFindings.includes(index) 
                  ? "border-primary/30 bg-primary/5" 
                  : "border-border"
              }`}
            >
              <button
                onClick={() => toggleFinding(index)}
                className="w-full text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(finding.complianceStatus)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-foreground line-clamp-1">{finding.summary}</h4>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform ${
                        expandedFindings.includes(index) ? "rotate-90" : ""
                      }`} />
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
                        DPDP {finding.section}
                      </span>
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {finding.clauseDescription}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        {getRiskBadge(finding.riskLevel)}
                        {getStatusBadge(finding.complianceStatus)}
                      </div>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <div className={`h-1.5 w-6 rounded-full overflow-hidden ${
                          finding.riskLevel === "Low" ? "bg-green-500/20" :
                          finding.riskLevel === "Medium" ? "bg-amber-500/20" : "bg-red-500/20"
                        }`}>
                          <div 
                            className={`h-full ${
                              finding.riskLevel === "Low" ? "bg-green-500" :
                              finding.riskLevel === "Medium" ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${getRiskScore(finding.riskLevel)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expandable Content */}
              {expandedFindings.includes(index) && (
                <div className="mt-4 pt-4 border-t animate-in slide-in-from-top duration-200">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Explanation</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{finding.explanation}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Remediation Steps</p>
                      <ul className="space-y-1">
                        {finding.remediation.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary font-semibold text-xs mt-0.5">{idx + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {finding.references && finding.references.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs font-medium text-foreground mb-1">References</p>
                        <div className="flex flex-wrap gap-1">
                          {finding.references.slice(0, 2).map((ref, idx) => (
                            <span key={idx} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {ref}
                            </span>
                          ))}
                          {finding.references.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{finding.references.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Template
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Need help?</p>
            <p className="text-xs text-muted-foreground">Get expert consultation</p>
          </div>
          <Button size="sm" className="h-8 text-xs gap-1">
            Schedule
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </Card>
    </div>
  );
};